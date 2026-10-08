-- =====================================================================
-- V3: vistas de consulta de la fase 1
-- El saldo se deriva siempre de los movimientos: no hay columna de saldo.
-- =====================================================================

-- Saldo de cada cuenta en la moneda de la cuenta.
-- Las consultas deben filtrar por user_id (o por account_id de una cuenta del usuario).
CREATE VIEW v_account_balances AS
SELECT a.id       AS account_id,
       a.user_id,
       a.currency,
       a.initial_balance + COALESCE(SUM(t.amount) FILTER (WHERE t.voided_at IS NULL), 0) AS balance
  FROM accounts a
  LEFT JOIN transactions t ON t.account_id = a.id
 GROUP BY a.id;
