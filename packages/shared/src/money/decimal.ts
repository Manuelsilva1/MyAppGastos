/**
 * Aritmética de dinero sin floats (regla de dominio 1).
 *
 * Los montos viajan como strings decimales con hasta 4 decimales, igual que NUMERIC(19,4).
 * Internamente se pasan a BigInt en unidades de 0,0001, así que ninguna operación pasa por `number`.
 */

const MONEY_RE = /^-?\d{1,15}(\.\d{1,4})?$/;
const SCALE = 10n ** 4n;

export class InvalidMoneyError extends Error {
  constructor(value: string) {
    super(`Monto inválido: "${value}"`);
    this.name = 'InvalidMoneyError';
  }
}

export function isMoney(value: string): boolean {
  return MONEY_RE.test(value);
}

/** Convierte un monto string a unidades de 0,0001. Lanza `InvalidMoneyError` si el formato no es válido. */
export function toUnits(value: string): bigint {
  if (!MONEY_RE.test(value)) {
    throw new InvalidMoneyError(value);
  }
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [intPart, fracPart = ''] = unsigned.split('.');
  const units = BigInt(intPart) * SCALE + BigInt(fracPart.padEnd(4, '0'));
  return negative ? -units : units;
}

/** Convierte unidades de 0,0001 a monto string con 4 decimales (formato de la API). */
export function fromUnits(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const intPart = abs / SCALE;
  const fracPart = (abs % SCALE).toString().padStart(4, '0');
  const sign = negative && abs !== 0n ? '-' : '';
  return `${sign}${intPart}.${fracPart}`;
}

export function addMoney(a: string, b: string): string {
  return fromUnits(toUnits(a) + toUnits(b));
}

export function subtractMoney(a: string, b: string): string {
  return fromUnits(toUnits(a) - toUnits(b));
}

export function negateMoney(value: string): string {
  return fromUnits(-toUnits(value));
}

export function sumMoney(values: readonly string[]): string {
  return fromUnits(values.reduce<bigint>((acc, v) => acc + toUnits(v), 0n));
}

/** Devuelve -1, 0 o 1, como un comparador. */
export function compareMoney(a: string, b: string): -1 | 0 | 1 {
  const ua = toUnits(a);
  const ub = toUnits(b);
  if (ua === ub) return 0;
  return ua < ub ? -1 : 1;
}

/**
 * Redondea a una cantidad de decimales (mitad hacia arriba en valor absoluto).
 * El resultado tiene siempre `decimals` decimales; con 0 no lleva punto.
 */
export function roundMoney(value: string, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
    throw new RangeError(`decimals debe estar entre 0 y 4, se recibió ${decimals}`);
  }
  const units = toUnits(value);
  const step = 10n ** BigInt(4 - decimals);
  const abs = units < 0n ? -units : units;
  const rounded = ((abs + step / 2n) / step) * step;
  const signed = units < 0n ? -rounded : rounded;
  const text = fromUnits(signed);
  return decimals === 0 ? text.split('.')[0] : text.slice(0, text.length - (4 - decimals));
}
