-- =====================================================================
-- V1: esquema de la fase 1
-- Convenciones: PK UUID (generado por el cliente en transactions y transfers),
-- created_at / updated_at en todas las tablas (excepto audit_log, que usa "at"),
-- montos NUMERIC(19,4), monedas CHAR(3) ISO 4217, user_id en toda entidad del usuario.
-- =====================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Usuarios y autenticación
-- ---------------------------------------------------------------------
CREATE TABLE currencies (
    code        CHAR(3)  PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
    name        TEXT     NOT NULL,
    symbol      TEXT     NOT NULL,
    decimals    SMALLINT NOT NULL DEFAULT 2 CHECK (decimals BETWEEN 0 AND 4),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    name           TEXT NOT NULL,
    base_currency  CHAR(3) NOT NULL DEFAULT 'UYU' REFERENCES currencies(code),
    locale         TEXT NOT NULL DEFAULT 'es-UY',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_tokens_user ON refresh_tokens (user_id);

-- ---------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------
CREATE TABLE exchange_rates (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id),
    from_currency  CHAR(3) NOT NULL REFERENCES currencies(code),
    to_currency    CHAR(3) NOT NULL REFERENCES currencies(code),
    rate           NUMERIC(19,8) NOT NULL CHECK (rate > 0),
    rate_date      DATE NOT NULL,
    source         TEXT NOT NULL CHECK (source IN ('MANUAL', 'API')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exchange_rates UNIQUE (user_id, from_currency, to_currency, rate_date),
    CONSTRAINT ck_exchange_rates_distinct CHECK (from_currency <> to_currency)
);

-- ---------------------------------------------------------------------
-- Cuentas
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id),
    name                  TEXT NOT NULL CHECK (btrim(name) <> ''),
    type                  TEXT NOT NULL CHECK (type IN ('CASH', 'BANK', 'CREDIT_CARD', 'WALLET', 'SAVINGS')),
    currency              CHAR(3) NOT NULL REFERENCES currencies(code),
    initial_balance       NUMERIC(19,4) NOT NULL DEFAULT 0,
    initial_balance_date  DATE NOT NULL,
    color                 TEXT,
    icon                  TEXT,
    include_in_total      BOOLEAN NOT NULL DEFAULT true,
    sort_order            INT NOT NULL DEFAULT 0,
    archived_at           TIMESTAMPTZ,
    version               INT NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Nombre único solo entre las cuentas no archivadas
CREATE UNIQUE INDEX uq_accounts_user_name_active ON accounts (user_id, name) WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------
-- Categorías (máximo 2 niveles) y etiquetas
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    parent_id   UUID REFERENCES categories(id),
    name        TEXT NOT NULL CHECK (btrim(name) <> ''),
    kind        TEXT NOT NULL CHECK (kind IN ('EXPENSE', 'INCOME')),
    color       TEXT,
    icon        TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    archived_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- NULLS NOT DISTINCT (PostgreSQL 15+): las raíces también son únicas por (usuario, tipo, nombre)
    CONSTRAINT uq_categories_user_parent_kind_name UNIQUE NULLS NOT DISTINCT (user_id, parent_id, kind, name),
    CONSTRAINT ck_categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX ix_categories_user   ON categories (user_id);
CREATE INDEX ix_categories_parent ON categories (parent_id);

CREATE OR REPLACE FUNCTION categories_check_hierarchy() RETURNS trigger AS $$
DECLARE
    parent_row categories%ROWTYPE;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Una raíz que cambia de tipo arrastra a sus hijas: no se permite si las tiene
        IF TG_OP = 'UPDATE' AND NEW.kind <> OLD.kind
           AND EXISTS (SELECT 1 FROM categories WHERE parent_id = NEW.id) THEN
            RAISE EXCEPTION 'No se puede cambiar el tipo de una categoría que tiene subcategorías'
                USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
    END IF;

    SELECT * INTO parent_row FROM categories WHERE id = NEW.parent_id;
    IF NOT FOUND OR parent_row.user_id <> NEW.user_id THEN
        RAISE EXCEPTION 'Categoría padre inválida' USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF parent_row.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Las categorías admiten máximo 2 niveles' USING ERRCODE = 'check_violation';
    END IF;
    IF parent_row.kind <> NEW.kind THEN
        RAISE EXCEPTION 'La subcategoría debe tener el mismo tipo que su categoría padre'
            USING ERRCODE = 'check_violation';
    END IF;
    -- Una categoría que ya tiene hijas no puede convertirse en subcategoría (quedaría en 3 niveles)
    IF TG_OP = 'UPDATE' AND EXISTS (SELECT 1 FROM categories WHERE parent_id = NEW.id) THEN
        RAISE EXCEPTION 'Una categoría con subcategorías no puede pasar a ser subcategoría'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_hierarchy
    BEFORE INSERT OR UPDATE OF parent_id, kind ON categories
    FOR EACH ROW EXECUTE FUNCTION categories_check_hierarchy();

CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL CHECK (btrim(name) <> ''),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tags_user_name UNIQUE (user_id, name)
);

-- ---------------------------------------------------------------------
-- Transferencias (cabecera). Sus dos movimientos están en transactions.
-- ---------------------------------------------------------------------
CREATE TABLE transfers (
    id               UUID PRIMARY KEY,  -- generado por el cliente
    user_id          UUID NOT NULL REFERENCES users(id),
    from_account_id  UUID NOT NULL REFERENCES accounts(id),
    to_account_id    UUID NOT NULL REFERENCES accounts(id),
    from_amount      NUMERIC(19,4) NOT NULL CHECK (from_amount > 0),
    to_amount        NUMERIC(19,4) NOT NULL CHECK (to_amount > 0),
    exchange_rate    NUMERIC(19,8) CHECK (exchange_rate IS NULL OR exchange_rate > 0),
    occurred_on      DATE NOT NULL,
    description      TEXT,
    voided_at        TIMESTAMPTZ,
    version          INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_transfers_distinct_accounts CHECK (from_account_id <> to_account_id)
);
CREATE INDEX ix_transfers_user ON transfers (user_id);

CREATE OR REPLACE FUNCTION transfers_check_accounts() RETURNS trigger AS $$
DECLARE
    from_cur   CHAR(3);
    to_cur     CHAR(3);
    from_owner UUID;
    to_owner   UUID;
BEGIN
    SELECT currency, user_id INTO from_cur, from_owner FROM accounts WHERE id = NEW.from_account_id;
    SELECT currency, user_id INTO to_cur,   to_owner   FROM accounts WHERE id = NEW.to_account_id;

    IF from_owner <> NEW.user_id OR to_owner <> NEW.user_id THEN
        RAISE EXCEPTION 'Las cuentas de la transferencia deben pertenecer al usuario'
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF from_cur = to_cur THEN
        IF NEW.from_amount <> NEW.to_amount OR NEW.exchange_rate IS NOT NULL THEN
            RAISE EXCEPTION 'Entre cuentas de la misma moneda: from_amount = to_amount y exchange_rate NULL'
                USING ERRCODE = 'check_violation';
        END IF;
    ELSIF NEW.exchange_rate IS NULL THEN
        RAISE EXCEPTION 'Entre cuentas de distinta moneda el tipo de cambio es obligatorio'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transfers_accounts
    BEFORE INSERT OR UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION transfers_check_accounts();

-- ---------------------------------------------------------------------
-- Movimientos
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    id                       UUID PRIMARY KEY,  -- generado por el cliente
    user_id                  UUID NOT NULL REFERENCES users(id),
    account_id               UUID NOT NULL REFERENCES accounts(id),
    type                     TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT')),
    amount                   NUMERIC(19,4) NOT NULL,
    category_id              UUID REFERENCES categories(id),
    transfer_id              UUID REFERENCES transfers(id),
    description              TEXT,
    note                     TEXT,
    occurred_on              DATE NOT NULL,
    voided_at                TIMESTAMPTZ,
    void_reason              TEXT,
    version                  INT NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_tx_amount_sign CHECK (
           (type IN ('EXPENSE', 'TRANSFER_OUT') AND amount < 0)
        OR (type IN ('INCOME', 'TRANSFER_IN')   AND amount > 0)
        OR (type = 'ADJUSTMENT'                 AND amount <> 0)),
    CONSTRAINT ck_tx_category_required CHECK ((type IN ('EXPENSE', 'INCOME')) = (category_id IS NOT NULL)),
    CONSTRAINT ck_tx_transfer_required CHECK ((type IN ('TRANSFER_OUT', 'TRANSFER_IN')) = (transfer_id IS NOT NULL)),
    CONSTRAINT ck_tx_void_reason CHECK (voided_at IS NOT NULL OR void_reason IS NULL)
);
CREATE INDEX ix_tx_user_occurred    ON transactions (user_id, occurred_on DESC);
CREATE INDEX ix_tx_account_occurred ON transactions (account_id, occurred_on);
CREATE INDEX ix_tx_category         ON transactions (category_id);
CREATE INDEX ix_tx_transfer         ON transactions (transfer_id);
-- Cada transferencia tiene como máximo una salida y una entrada
CREATE UNIQUE INDEX uq_tx_transfer_type ON transactions (transfer_id, type) WHERE transfer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION transactions_check_refs() RETURNS trigger AS $$
DECLARE
    account_owner UUID;
    category_owner UUID;
    category_kind  TEXT;
    transfer_owner UUID;
BEGIN
    SELECT user_id INTO account_owner FROM accounts WHERE id = NEW.account_id;
    IF account_owner <> NEW.user_id THEN
        RAISE EXCEPTION 'La cuenta no pertenece al usuario' USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF NEW.category_id IS NOT NULL THEN
        SELECT user_id, kind INTO category_owner, category_kind FROM categories WHERE id = NEW.category_id;
        IF category_owner <> NEW.user_id THEN
            RAISE EXCEPTION 'La categoría no pertenece al usuario' USING ERRCODE = 'foreign_key_violation';
        END IF;
        -- EXPENSE y INCOME usan categorías de su mismo tipo (los valores coinciden)
        IF category_kind <> NEW.type THEN
            RAISE EXCEPTION 'La categoría no corresponde al tipo del movimiento' USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    IF NEW.transfer_id IS NOT NULL THEN
        SELECT user_id INTO transfer_owner FROM transfers WHERE id = NEW.transfer_id;
        IF transfer_owner <> NEW.user_id THEN
            RAISE EXCEPTION 'La transferencia no pertenece al usuario' USING ERRCODE = 'foreign_key_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_refs
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION transactions_check_refs();

-- Verifica que una transferencia tenga exactamente una salida (desde from_account, por from_amount)
-- y una entrada (hacia to_account, por to_amount). Se evalúa al COMMIT, así la transferencia
-- y sus dos movimientos se pueden insertar en cualquier orden dentro de la misma transacción.
CREATE OR REPLACE FUNCTION check_transfer_pair(p_transfer_id UUID) RETURNS void AS $$
DECLARE
    tr        transfers%ROWTYPE;
    total_    INT;
    out_ok    INT;
    in_ok     INT;
BEGIN
    SELECT * INTO tr FROM transfers WHERE id = p_transfer_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE type = 'TRANSFER_OUT'
                              AND account_id = tr.from_account_id AND amount = -tr.from_amount),
           COUNT(*) FILTER (WHERE type = 'TRANSFER_IN'
                              AND account_id = tr.to_account_id   AND amount = tr.to_amount)
      INTO total_, out_ok, in_ok
      FROM transactions
     WHERE transfer_id = p_transfer_id;

    IF total_ <> 2 OR out_ok <> 1 OR in_ok <> 1 THEN
        RAISE EXCEPTION 'La transferencia % debe tener una salida y una entrada que coincidan con sus montos',
            p_transfer_id USING ERRCODE = 'check_violation';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_transfers_pair_check() RETURNS trigger AS $$
BEGIN
    PERFORM check_transfer_pair(NEW.id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_transactions_pair_check() RETURNS trigger AS $$
BEGIN
    IF NEW.transfer_id IS NOT NULL THEN
        PERFORM check_transfer_pair(NEW.transfer_id);
    END IF;
    -- Si el movimiento se desvincula de una transferencia, esa transferencia también se revalida
    IF TG_OP = 'UPDATE' AND OLD.transfer_id IS NOT NULL AND OLD.transfer_id IS DISTINCT FROM NEW.transfer_id THEN
        PERFORM check_transfer_pair(OLD.transfer_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_transfers_pair
    AFTER INSERT OR UPDATE ON transfers
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION trg_transfers_pair_check();

CREATE CONSTRAINT TRIGGER trg_transactions_pair
    AFTER INSERT OR UPDATE ON transactions
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION trg_transactions_pair_check();

CREATE TABLE transaction_tags (
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    tag_id          UUID NOT NULL REFERENCES tags(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (transaction_id, tag_id)
);
CREATE INDEX ix_transaction_tags_tag ON transaction_tags (tag_id);

-- ---------------------------------------------------------------------
-- Gastos e ingresos recurrentes
-- ---------------------------------------------------------------------
CREATE TABLE recurring_rules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id),
    name           TEXT NOT NULL CHECK (btrim(name) <> ''),
    kind           TEXT NOT NULL CHECK (kind IN ('EXPENSE', 'INCOME')),
    account_id     UUID NOT NULL REFERENCES accounts(id),
    category_id    UUID NOT NULL REFERENCES categories(id),
    amount         NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    is_estimate    BOOLEAN NOT NULL DEFAULT false,
    frequency      TEXT NOT NULL CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'YEARLY', 'EVERY_N_DAYS')),
    interval_count INT NOT NULL DEFAULT 1 CHECK (interval_count >= 1),
    day_of_month   SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),  -- YEARLY usa el mes de start_date
    day_of_week    SMALLINT CHECK (day_of_week BETWEEN 1 AND 7),  -- ISO: 1 = lunes, 7 = domingo
    start_date     DATE NOT NULL,
    end_date       DATE,
    next_due_date  DATE NOT NULL,
    active         BOOLEAN NOT NULL DEFAULT true,
    auto_confirm   BOOLEAN NOT NULL DEFAULT false,
    version        INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_rr_end_after_start CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT ck_rr_frequency_fields CHECK (CASE frequency
            WHEN 'MONTHLY' THEN day_of_month IS NOT NULL
            WHEN 'YEARLY'  THEN day_of_month IS NOT NULL
            WHEN 'WEEKLY'  THEN day_of_week IS NOT NULL
            ELSE true END)
);
CREATE INDEX ix_recurring_rules_user ON recurring_rules (user_id);

CREATE OR REPLACE FUNCTION recurring_rules_check_refs() RETURNS trigger AS $$
DECLARE
    account_owner  UUID;
    category_owner UUID;
    category_kind  TEXT;
BEGIN
    SELECT user_id INTO account_owner FROM accounts WHERE id = NEW.account_id;
    SELECT user_id, kind INTO category_owner, category_kind FROM categories WHERE id = NEW.category_id;
    IF account_owner <> NEW.user_id OR category_owner <> NEW.user_id THEN
        RAISE EXCEPTION 'Cuenta o categoría no pertenecen al usuario' USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF category_kind <> NEW.kind THEN
        RAISE EXCEPTION 'La categoría no corresponde al tipo de la regla' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recurring_rules_refs
    BEFORE INSERT OR UPDATE ON recurring_rules
    FOR EACH ROW EXECUTE FUNCTION recurring_rules_check_refs();

CREATE TABLE recurring_occurrences (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id),
    rule_id          UUID NOT NULL REFERENCES recurring_rules(id),
    due_date         DATE NOT NULL,
    expected_amount  NUMERIC(19,4) NOT NULL CHECK (expected_amount > 0),
    status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SKIPPED')),
    transaction_id   UUID UNIQUE REFERENCES transactions(id),
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_recurring_occurrences_rule_due UNIQUE (rule_id, due_date),
    CONSTRAINT ck_ro_confirmed_has_tx CHECK (status <> 'CONFIRMED' OR transaction_id IS NOT NULL),
    CONSTRAINT ck_ro_resolved_at CHECK ((status = 'PENDING') = (resolved_at IS NULL))
);
CREATE INDEX ix_recurring_occurrences_user_due ON recurring_occurrences (user_id, due_date);

-- La ocurrencia y su movimiento deben ser del mismo usuario, y la ocurrencia debe ser de la regla del usuario
CREATE OR REPLACE FUNCTION recurring_occurrences_check_refs() RETURNS trigger AS $$
DECLARE
    rule_owner UUID;
    tx_owner   UUID;
BEGIN
    SELECT user_id INTO rule_owner FROM recurring_rules WHERE id = NEW.rule_id;
    IF rule_owner <> NEW.user_id THEN
        RAISE EXCEPTION 'La ocurrencia debe pertenecer al mismo usuario que su regla' USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF NEW.transaction_id IS NOT NULL THEN
        SELECT user_id INTO tx_owner FROM transactions WHERE id = NEW.transaction_id;
        IF tx_owner <> NEW.user_id THEN
            RAISE EXCEPTION 'El movimiento confirmado debe pertenecer al mismo usuario' USING ERRCODE = 'foreign_key_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recurring_occurrences_refs
    BEFORE INSERT OR UPDATE ON recurring_occurrences
    FOR EACH ROW EXECUTE FUNCTION recurring_occurrences_check_refs();

-- ---------------------------------------------------------------------
-- Auditoría (append-only)
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id),
    entity_type  TEXT NOT NULL,
    entity_id    UUID NOT NULL,
    action       TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'VOID')),
    before       JSONB,
    after        JSONB,
    at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_entity ON audit_log (entity_type, entity_id, at);
CREATE INDEX ix_audit_user   ON audit_log (user_id, at);

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log es de solo inserción' USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_currencies_updated_at          BEFORE UPDATE ON currencies          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at               BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_refresh_tokens_updated_at      BEFORE UPDATE ON refresh_tokens      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_exchange_rates_updated_at      BEFORE UPDATE ON exchange_rates      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_accounts_updated_at            BEFORE UPDATE ON accounts            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at          BEFORE UPDATE ON categories          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tags_updated_at                BEFORE UPDATE ON tags                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transfers_updated_at           BEFORE UPDATE ON transfers           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at        BEFORE UPDATE ON transactions        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transaction_tags_updated_at    BEFORE UPDATE ON transaction_tags    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_recurring_rules_updated_at     BEFORE UPDATE ON recurring_rules     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_recurring_occurrences_updated_at BEFORE UPDATE ON recurring_occurrences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
