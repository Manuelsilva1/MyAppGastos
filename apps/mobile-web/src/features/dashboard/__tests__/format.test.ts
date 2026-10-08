import { barPercent, relativeDue, shareToPercent } from '../format';

describe('fechas relativas de vencimientos', () => {
  test('hoy, mañana, en N días y vencidos', () => {
    expect(relativeDue(0)).toBe('hoy');
    expect(relativeDue(1)).toBe('mañana');
    expect(relativeDue(3)).toBe('en 3 días');
    expect(relativeDue(-1)).toBe('vencido ayer');
    expect(relativeDue(-2)).toBe('vencido hace 2 días');
  });
});

describe('barras', () => {
  test('proporción de la API a porcentaje sin usar number para el monto', () => {
    expect(shareToPercent('0.3361')).toBe(33);
    expect(shareToPercent('1.0000')).toBe(100);
    expect(shareToPercent('0')).toBe(0);
  });

  test('ancho relativo al máximo', () => {
    expect(barPercent('16000.0000', '32000.0000')).toBe(50);
    expect(barPercent('18450.5000', '32000.0000')).toBe(57);
    expect(barPercent('100', '0')).toBe(0);
  });
});
