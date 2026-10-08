/**
 * Entrada de monto del teclado numérico propio de la carga rápida.
 * Trabaja sobre el texto que muestra el teclado (coma decimal, como es-UY):
 * "0", "12", "12,5", "12,50". Nunca convierte a number.
 */

export type MoneyKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'back';

const MAX_INTEGER_DIGITS = 12;
const MAX_DECIMALS = 2;

export function appendKey(value: string, key: MoneyKey): string {
  if (key === 'back') {
    return value.length <= 1 ? '0' : value.slice(0, -1);
  }
  if (key === ',') {
    return value.includes(',') ? value : `${value},`;
  }
  const [integerPart, decimals] = value.split(',');
  if (decimals !== undefined) {
    return decimals.length >= MAX_DECIMALS ? value : `${value}${key}`;
  }
  if (integerPart === '0') {
    // El cero inicial se reemplaza, salvo que se tipee otro cero.
    return key === '0' ? value : key;
  }
  return integerPart.length >= MAX_INTEGER_DIGITS ? value : `${value}${key}`;
}

/** Convierte el texto del teclado a monto string con punto ("12,5" -> "12.5"). */
export function toMoneyString(value: string): string {
  const normalized = value.replace(',', '.');
  return normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
}

export function isZero(value: string): boolean {
  return /^0([,]0*)?$/.test(value);
}
