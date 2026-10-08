import {
  addMoney,
  compareMoney,
  formatMoney,
  fromUnits,
  InvalidMoneyError,
  negateMoney,
  roundMoney,
  subtractMoney,
  sumMoney,
  toUnits,
} from '../money';

describe('aritmética de dinero sin floats', () => {
  test('0.1 + 0.2 da exactamente 0.3 (con number daría 0.30000000000000004)', () => {
    expect(addMoney('0.1', '0.2')).toBe('0.3000');
  });

  test('suma de muchos centavos sin error de punto flotante', () => {
    const cents = Array.from({ length: 1000 }, () => '0.01');
    expect(sumMoney(cents)).toBe('10.0000');
  });

  test('resta y negación con signo', () => {
    expect(subtractMoney('100.50', '250.25')).toBe('-149.7500');
    expect(negateMoney('-45.1234')).toBe('45.1234');
    expect(negateMoney('0')).toBe('0.0000');
  });

  test('admite hasta 15 enteros y 4 decimales', () => {
    expect(addMoney('999999999999999.9999', '0.0001')).toBe('1000000000000000.0000');
    expect(() => toUnits('1234567890123456')).toThrow(InvalidMoneyError);
    expect(() => toUnits('1.23456')).toThrow(InvalidMoneyError);
  });

  test('rechaza formatos que no son montos', () => {
    for (const bad of ['', '1,50', '1e3', ' 10', '10.', '.5', 'abc', '+5']) {
      expect(() => toUnits(bad)).toThrow(InvalidMoneyError);
    }
  });

  test('compara montos exactamente', () => {
    expect(compareMoney('0.30', '0.3')).toBe(0);
    expect(compareMoney('-1', '0')).toBe(-1);
    expect(compareMoney('5', '4.9999')).toBe(1);
  });

  test('fromUnits devuelve siempre 4 decimales y sin signo para cero', () => {
    expect(fromUnits(-5n)).toBe('-0.0005');
    expect(fromUnits(0n)).toBe('0.0000');
  });
});

describe('redondeo', () => {
  test('redondea mitad hacia arriba en valor absoluto', () => {
    expect(roundMoney('1.005', 2)).toBe('1.01');
    expect(roundMoney('-1.005', 2)).toBe('-1.01');
    expect(roundMoney('2.5', 0)).toBe('3');
    expect(roundMoney('1.2345', 2)).toBe('1.23');
  });

  test('siempre devuelve la cantidad de decimales pedida', () => {
    expect(roundMoney('7', 2)).toBe('7.00');
    expect(roundMoney('7.1', 4)).toBe('7.1000');
  });

  test('rechaza decimales fuera de rango', () => {
    expect(() => roundMoney('1', 5)).toThrow(RangeError);
  });
});

describe('formato es-UY', () => {
  test('muestra símbolo, miles con punto y decimales con coma', () => {
    expect(formatMoney('1234.5', { symbol: '$' })).toBe('$ 1.234,50');
    expect(formatMoney('120', { symbol: 'US$' })).toBe('US$ 120,00');
    expect(formatMoney('32000', { symbol: '$' })).toBe('$ 32.000,00');
    expect(formatMoney('1234567.89', { symbol: '$' })).toBe('$ 1.234.567,89');
  });

  test('signo negativo tipográfico solo en el modo por defecto', () => {
    expect(formatMoney('-450', { symbol: '$' })).toBe('− $ 450,00');
    expect(formatMoney('-450', { symbol: '$', signMode: 'none' })).toBe('$ 450,00');
  });

  test('modo explícito muestra + o −', () => {
    expect(formatMoney('32000', { symbol: '$', signMode: 'explicit' })).toBe('+ $ 32.000,00');
    expect(formatMoney('-450', { symbol: '$', signMode: 'explicit' })).toBe('− $ 450,00');
  });

  test('un valor que se redondea a cero no lleva signo', () => {
    expect(formatMoney('-0.001', { symbol: '$' })).toBe('$ 0,00');
  });

  test('moneda sin decimales', () => {
    expect(formatMoney('1500.7', { symbol: '¥', decimals: 0 })).toBe('¥ 1.501');
  });
});
