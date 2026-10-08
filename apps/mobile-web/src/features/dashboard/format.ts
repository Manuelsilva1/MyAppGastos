/** Fecha relativa de un vencimiento: "hoy", "mañana", "en 3 días", "vencido hace 2 días". */
export function relativeDue(daysUntil: number): string {
  if (daysUntil === 0) return 'hoy';
  if (daysUntil === 1) return 'mañana';
  if (daysUntil > 1) return `en ${daysUntil} días`;
  if (daysUntil === -1) return 'vencido ayer';
  return `vencido hace ${Math.abs(daysUntil)} días`;
}

/**
 * Proporción 0..1 (string con 4 decimales, como viene de la API) a porcentaje entero para barras.
 * Se calcula con enteros para no pasar montos por number.
 */
export function shareToPercent(share: string): number {
  const [int, frac = ''] = share.split('.');
  const basisPoints = BigInt(int) * 10000n + BigInt(frac.padEnd(4, '0').slice(0, 4));
  const percent = basisPoints / 100n;
  return Math.min(100, Math.max(0, Number(percent)));
}

/** Ancho de una barra relativa al máximo, en porcentaje entero. Entradas: montos string sin signo. */
export function barPercent(value: string, max: string): number {
  const toUnitsBig = (v: string) => {
    const [int, frac = ''] = v.replace('-', '').split('.');
    return BigInt(int) * 10000n + BigInt(frac.padEnd(4, '0').slice(0, 4));
  };
  const maxUnits = toUnitsBig(max);
  if (maxUnits === 0n) return 0;
  return Number((toUnitsBig(value) * 100n) / maxUnits);
}
