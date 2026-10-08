import { positiveMoneySchema, transactionCreateSchema, transferCreateSchema } from '../schemas';

const ids = {
  tx: '5c8e1f2a-3b4d-4e5f-8a9b-0c1d2e3f4a5b',
  account: '3f9a1c2e-8b7d-4c6e-a5f4-0d1e2f3a4b5c',
  otherAccount: '4a0b1c2d-3e4f-4051-8263-74859a6b7c8d',
  category: '1e2d3c4b-5a69-4788-9900-aabbccddeeff',
};

const baseExpense = {
  id: ids.tx,
  accountId: ids.account,
  type: 'EXPENSE',
  amount: '450.00',
  categoryId: ids.category,
  occurredOn: '2026-10-07',
};

describe('transactionCreateSchema', () => {
  test('acepta un gasto válido con monto positivo', () => {
    expect(transactionCreateSchema.safeParse(baseExpense).success).toBe(true);
  });

  test('rechaza un gasto con monto negativo (el signo lo pone el servidor)', () => {
    const r = transactionCreateSchema.safeParse({ ...baseExpense, amount: '-450.00' });
    expect(r.success).toBe(false);
  });

  test('rechaza un gasto sin categoría', () => {
    const { categoryId: _omit, ...withoutCategory } = baseExpense;
    expect(transactionCreateSchema.safeParse(withoutCategory).success).toBe(false);
  });

  test('un ajuste admite signo, pero no cero ni categoría', () => {
    const adj = { id: ids.tx, accountId: ids.account, type: 'ADJUSTMENT', amount: '-120.5000', occurredOn: '2026-10-07' };
    expect(transactionCreateSchema.safeParse(adj).success).toBe(true);
    expect(transactionCreateSchema.safeParse({ ...adj, amount: '0' }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({ ...adj, categoryId: ids.category }).success).toBe(false);
  });

  test('rechaza montos con más de 4 decimales o como número JS', () => {
    expect(transactionCreateSchema.safeParse({ ...baseExpense, amount: '1.23456' }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({ ...baseExpense, amount: 450 as unknown as string }).success).toBe(false);
  });

  test('rechaza una fecha imposible', () => {
    expect(transactionCreateSchema.safeParse({ ...baseExpense, occurredOn: '2026-02-31' }).success).toBe(false);
  });

  test('rechaza más de 10 etiquetas', () => {
    const tags = Array.from({ length: 11 }, () => ids.category);
    expect(transactionCreateSchema.safeParse({ ...baseExpense, tagIds: tags }).success).toBe(false);
  });
});

describe('transferCreateSchema', () => {
  const base = {
    id: ids.tx,
    fromAccountId: ids.account,
    toAccountId: ids.otherAccount,
    fromAmount: '5000.00',
    toAmount: '5000.00',
    occurredOn: '2026-10-07',
  };

  test('misma moneda: válida sin tipo de cambio y con montos iguales', () => {
    const schema = transferCreateSchema({ sameCurrency: true });
    expect(schema.safeParse(base).success).toBe(true);
  });

  test('misma moneda: rechaza tipo de cambio y montos distintos', () => {
    const schema = transferCreateSchema({ sameCurrency: true });
    expect(schema.safeParse({ ...base, exchangeRate: '1' }).success).toBe(false);
    expect(schema.safeParse({ ...base, toAmount: '4999.99' }).success).toBe(false);
  });

  test('distinta moneda: exige tipo de cambio', () => {
    const schema = transferCreateSchema({ sameCurrency: false });
    expect(schema.safeParse({ ...base, toAmount: '125.00' }).success).toBe(false);
    expect(schema.safeParse({ ...base, toAmount: '125.00', exchangeRate: '0.02500000' }).success).toBe(true);
  });

  test('rechaza transferir a la misma cuenta', () => {
    const schema = transferCreateSchema({ sameCurrency: true });
    expect(schema.safeParse({ ...base, toAccountId: ids.account }).success).toBe(false);
  });

  test('rechaza montos cero o negativos', () => {
    const schema = transferCreateSchema({ sameCurrency: true });
    expect(schema.safeParse({ ...base, fromAmount: '0', toAmount: '0' }).success).toBe(false);
    expect(schema.safeParse({ ...base, fromAmount: '-1', toAmount: '-1' }).success).toBe(false);
  });
});

describe('positiveMoneySchema', () => {
  test('acepta mayores que cero y rechaza cero', () => {
    expect(positiveMoneySchema.safeParse('0.0001').success).toBe(true);
    expect(positiveMoneySchema.safeParse('0.0000').success).toBe(false);
  });
});
