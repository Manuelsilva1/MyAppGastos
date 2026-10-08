import { appendKey, isZero, toMoneyString } from '../amountInput';

function type(keys: Parameters<typeof appendKey>[1][]): string {
  return keys.reduce<string>((value, key) => appendKey(value, key), '0');
}

describe('teclado de monto', () => {
  test('arranca en 0 y reemplaza el cero inicial', () => {
    expect(type(['4', '5'])).toBe('45');
    expect(type(['0', '0'])).toBe('0');
  });

  test('coma decimal, máximo 2 decimales', () => {
    expect(type(['1', '2', ',', '5', '0', '9'])).toBe('12,50');
    expect(type([','])).toBe('0,');
  });

  test('una sola coma', () => {
    expect(type(['1', ',', ',', '5'])).toBe('1,5');
  });

  test('máximo 12 dígitos enteros', () => {
    const twelve = type(Array.from({ length: 12 }, () => '9' as const));
    expect(appendKey(twelve, '9')).toBe(twelve);
  });

  test('borrar deja 0 al final', () => {
    expect(appendKey('12,5', 'back')).toBe('12,');
    expect(appendKey('1', 'back')).toBe('0');
  });
});

describe('conversión a monto string', () => {
  test('usa punto y no envía coma al backend', () => {
    expect(toMoneyString('1234,5')).toBe('1234.5');
    expect(toMoneyString('12,')).toBe('12');
    expect(toMoneyString('0')).toBe('0');
  });

  test('detecta cero', () => {
    expect(isZero('0')).toBe(true);
    expect(isZero('0,00')).toBe(true);
    expect(isZero('0,5')).toBe(false);
  });
});
