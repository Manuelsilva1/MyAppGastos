# Modelo ER: fase 1

Diagrama del esquema definido en `apps/api/src/main/resources/db/migration/V1__fase1_esquema.sql`.
Solo muestra las columnas clave; el detalle completo está en la migración.

Convención: los montos son `NUMERIC(19,4)`, las monedas `CHAR(3)` (ISO 4217) y todas las tablas tienen `created_at` y `updated_at`.

```mermaid
erDiagram
    CURRENCIES ||--o{ USERS : "moneda base"
    CURRENCIES ||--o{ ACCOUNTS : "moneda"
    CURRENCIES ||--o{ EXCHANGE_RATES : "from / to"
    USERS ||--o{ REFRESH_TOKENS : "sesiones"
    USERS ||--o{ ACCOUNTS : "posee"
    USERS ||--o{ CATEGORIES : "posee"
    USERS ||--o{ TAGS : "posee"
    USERS ||--o{ EXCHANGE_RATES : "cotiza"
    USERS ||--o{ TRANSFERS : "realiza"
    USERS ||--o{ TRANSACTIONS : "registra"
    USERS ||--o{ RECURRING_RULES : "define"
    USERS ||--o{ AUDIT_LOG : "genera"

    ACCOUNTS ||--o{ TRANSACTIONS : "movimientos"
    ACCOUNTS ||--o{ TRANSFERS : "origen"
    ACCOUNTS ||--o{ TRANSFERS : "destino"
    ACCOUNTS ||--o{ RECURRING_RULES : "cuenta"

    CATEGORIES ||--o{ CATEGORIES : "subcategorias"
    CATEGORIES ||--o{ TRANSACTIONS : "clasifica"
    CATEGORIES ||--o{ RECURRING_RULES : "clasifica"

    TRANSFERS ||--o{ TRANSACTIONS : "exactamente 2: OUT y IN"

    TRANSACTIONS ||--o{ TRANSACTION_TAGS : "etiquetas"
    TAGS ||--o{ TRANSACTION_TAGS : "usada en"

    RECURRING_RULES ||--o{ RECURRING_OCCURRENCES : "genera"
    RECURRING_OCCURRENCES |o--o| TRANSACTIONS : "confirmada como"

    USERS {
        uuid id PK
        text email UK
        text password_hash
        text name
        char3 base_currency FK
        text locale
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        text token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
    }

    CURRENCIES {
        char3 code PK
        text name
        text symbol
        smallint decimals
    }

    EXCHANGE_RATES {
        uuid id PK
        uuid user_id FK
        char3 from_currency FK
        char3 to_currency FK
        numeric rate "19,8"
        date rate_date
        text source "MANUAL o API"
    }

    ACCOUNTS {
        uuid id PK
        uuid user_id FK
        text name "UK parcial: solo no archivadas"
        text type "CASH, BANK, CREDIT_CARD, WALLET, SAVINGS"
        char3 currency FK
        numeric initial_balance "19,4"
        date initial_balance_date
        bool include_in_total
        timestamptz archived_at
        int version
    }

    CATEGORIES {
        uuid id PK
        uuid user_id FK
        uuid parent_id FK "nullable, max 2 niveles"
        text name
        text kind "EXPENSE o INCOME"
        timestamptz archived_at
    }

    TAGS {
        uuid id PK
        uuid user_id FK
        text name "UK por usuario"
    }

    TRANSFERS {
        uuid id PK "generado por el cliente"
        uuid user_id FK
        uuid from_account_id FK
        uuid to_account_id FK
        numeric from_amount "19,4"
        numeric to_amount "19,4"
        numeric exchange_rate "19,8, nullable"
        date occurred_on
        timestamptz voided_at
        int version
    }

    TRANSACTIONS {
        uuid id PK "generado por el cliente"
        uuid user_id FK
        uuid account_id FK
        text type "EXPENSE, INCOME, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT"
        numeric amount "19,4, con signo"
        uuid category_id FK "nullable"
        uuid transfer_id FK "nullable"
        uuid recurring_occurrence_id FK "nullable"
        date occurred_on
        timestamptz voided_at
        text void_reason
        int version
    }

    TRANSACTION_TAGS {
        uuid transaction_id PK
        uuid tag_id PK
    }

    RECURRING_RULES {
        uuid id PK
        uuid user_id FK
        text name
        text kind "EXPENSE o INCOME"
        uuid account_id FK
        uuid category_id FK
        numeric amount "19,4, positivo"
        bool is_estimate
        text frequency "WEEKLY, MONTHLY, YEARLY, EVERY_N_DAYS"
        int interval_count
        smallint day_of_month "1-31"
        smallint day_of_week "1-7, ISO"
        date next_due_date
        bool active
        bool auto_confirm
        int version
    }

    RECURRING_OCCURRENCES {
        uuid id PK
        uuid rule_id FK
        date due_date "UK con rule_id"
        numeric expected_amount "19,4"
        text status "PENDING, CONFIRMED, SKIPPED"
        uuid transaction_id FK "UK, nullable"
        timestamptz resolved_at
    }

    AUDIT_LOG {
        bigint id PK
        uuid user_id FK
        text entity_type
        uuid entity_id
        text action "CREATE, UPDATE, VOID"
        jsonb before
        jsonb after
        timestamptz at
    }
```

## Invariantes garantizadas por la base

| Regla | Dónde se garantiza |
|---|---|
| Signo del monto según el tipo (EXPENSE y TRANSFER_OUT < 0, INCOME y TRANSFER_IN > 0, ADJUSTMENT ≠ 0) | `CHECK` en `transactions` |
| `category_id` obligatorio solo para EXPENSE e INCOME | `CHECK` en `transactions` |
| `transfer_id` obligatorio solo para TRANSFER_OUT y TRANSFER_IN | `CHECK` en `transactions` |
| La categoría coincide con el tipo del movimiento (gasto con categoría de gasto) | Trigger `transactions_check_refs` |
| Una transferencia tiene exactamente una salida y una entrada que coinciden con sus montos y cuentas | Trigger diferido `trg_transfers_pair` / `trg_transactions_pair` (se evalúa al COMMIT) |
| Transferencia en la misma moneda: `from_amount = to_amount` y `exchange_rate` NULL; en distinta moneda, `exchange_rate` obligatorio | Trigger `trg_transfers_accounts` |
| Máximo 2 niveles de categorías y la subcategoría tiene el tipo de su padre | Trigger `trg_categories_hierarchy` |
| Cada ocurrencia recurrente se confirma una sola vez y cada transacción apunta a una sola ocurrencia | Índices únicos parciales y `UNIQUE` en `recurring_occurrences.transaction_id` |
| Una ocurrencia `CONFIRMED` tiene transacción vinculada | `CHECK` en `recurring_occurrences` |
| Entidades de un usuario no referencian datos de otro usuario | Triggers `transactions_check_refs`, `transfers_check_accounts`, `recurring_rules_check_refs`, `categories_check_hierarchy` |
| `audit_log` es solo de inserción | Trigger `trg_audit_log_immutable` |
| Saldo derivado: `initial_balance + SUM(amount)` de los movimientos no anulados | Vista `v_account_balances` (V3) |
