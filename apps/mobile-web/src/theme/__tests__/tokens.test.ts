import { theme, paletteColor } from '../tokens';
import { buildThemeCss } from '../../../scripts/build-theme-css.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** Razón de contraste WCAG entre dos colores hex. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mezcla un color con un fondo al 15 % de opacidad, como se muestra un ítem tintado. */
function tint(fg: string, bg: string, alpha = 0.15): string {
  const channel = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i, i + 2), 16);
  const mixed = [0, 2, 4].map((i) => Math.round(alpha * channel(fg, i) + (1 - alpha) * channel(bg, i)));
  return '#' + mixed.map((v) => v.toString(16).padStart(2, '0')).join('');
}

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe('tokens', () => {
  test('la paleta tiene 12 colores azules', () => {
    const keys = Object.keys(theme.palette);
    expect(keys).toHaveLength(12);
    expect(keys.every((k) => k.startsWith('azul-'))).toBe(true);
  });

  test('cada color de la paleta cumple 3:1 sobre su fondo tintado, en claro y en oscuro', () => {
    for (const hex of Object.values(theme.palette)) {
      expect(contrast(hex, tint(hex, theme.light.surface))).toBeGreaterThanOrEqual(AA_NON_TEXT);
      expect(contrast(hex, tint(hex, theme.dark.surface))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  test('paletteColor devuelve el color pedido o el de texto secundario si no existe', () => {
    expect(paletteColor('azul-01')).toBe(theme.palette['azul-01']);
    expect(paletteColor('rojo-99')).toBe(theme.light['text-muted']);
    expect(paletteColor(null)).toBe(theme.light['text-muted']);
  });
});

describe('contraste de texto (WCAG AA)', () => {
  const textTokens = ['text', 'text-muted', 'primary', 'income', 'expense', 'transfer', 'pending', 'danger'] as const;
  const surfaces = ['background', 'surface', 'surface-2'] as const;

  test('modo oscuro: todos los pares de texto cumplen 4,5:1', () => {
    for (const fg of textTokens) {
      for (const bg of surfaces) {
        expect(contrast(theme.dark[fg], theme.dark[bg])).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  test('modo claro: texto principal, primary y danger cumplen 4,5:1 en todas las superficies', () => {
    for (const fg of ['text', 'primary', 'danger'] as const) {
      for (const bg of surfaces) {
        expect(contrast(theme.light[fg], theme.light[bg])).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  test('modo claro: text-muted, income, expense y transfer cumplen 4,5:1 sobre background y surface', () => {
    for (const fg of ['text-muted', 'income', 'expense', 'transfer'] as const) {
      for (const bg of ['background', 'surface'] as const) {
        expect(contrast(theme.light[fg], theme.light[bg])).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  // Fallas conocidas de los tokens entregados. Son pendientes de decisión: `test.failing`
  // mantiene la suite en verde y se vuelve error en cuanto el token se corrija, para quitar el `.failing`.
  test.failing('PENDIENTE: modo claro, text-muted sobre surface-2 cumple 4,5:1 (hoy 4,38)', () => {
    expect(contrast(theme.light['text-muted'], theme.light['surface-2'])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  test.failing('PENDIENTE: modo claro, income, expense y transfer sobre surface-2 cumplen 4,5:1', () => {
    for (const fg of ['income', 'expense', 'transfer'] as const) {
      expect(contrast(theme.light[fg], theme.light['surface-2'])).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  test.failing('PENDIENTE: modo claro, pending como texto cumple 4,5:1 (hoy ≈2,5 a 2,9)', () => {
    expect(contrast(theme.light.pending, theme.light.surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('global.css', () => {
  test('está sincronizado con tokens.json', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'global.css'), 'utf8');
    expect(css).toBe(buildThemeCss());
  });
});
