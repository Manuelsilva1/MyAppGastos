import { roundMoney } from './decimal';

export type SignMode =
  /** Solo muestra el signo menos cuando el monto es negativo (saldos). */
  | 'negative-only'
  /** Muestra "+" o "−" siempre (movimientos con dirección). */
  | 'explicit'
  /** Nunca muestra signo: se muestra el valor absoluto. */
  | 'none';

export interface FormatMoneyOptions {
  /** Símbolo de la moneda, por ejemplo "$" o "US$". */
  symbol: string;
  /** Decimales de la moneda (default 2). */
  decimals?: number;
  signMode?: SignMode;
}

const MINUS = '−'; // signo menos tipográfico, como en la especificación de montos
const PLUS = '+';

/** Agrupa los miles con punto, como es-UY. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formatea un monto con el locale es-UY: `$ 1.234,50`, `US$ 120,00`.
 * Trabaja sobre el string, sin pasar el monto por `number`.
 */
export function formatMoney(value: string, options: FormatMoneyOptions): string {
  const { symbol, decimals = 2, signMode = 'negative-only' } = options;
  // El signo se decide sobre el valor redondeado: -0,001 con 2 decimales se muestra como 0,00 sin signo.
  const rounded = roundMoney(value, decimals);
  const isNegative = rounded.startsWith('-');
  const magnitude = rounded.startsWith('-') ? rounded.slice(1) : rounded;
  const [intPart, fracPart] = magnitude.split('.');
  const grouped = groupThousands(intPart);
  const text = fracPart === undefined ? grouped : `${grouped},${fracPart}`;

  let prefix = '';
  if (signMode === 'explicit') {
    prefix = isNegative ? MINUS : PLUS;
  } else if (signMode === 'negative-only' && isNegative) {
    prefix = MINUS;
  }
  return `${prefix}${prefix ? ' ' : ''}${symbol} ${text}`;
}
