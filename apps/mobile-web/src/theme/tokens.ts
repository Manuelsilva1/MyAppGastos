import { useColorScheme } from 'react-native';
import tokens from './tokens.json';

/** Fuente única de los tokens (tokens.json). Tailwind y el CSS generado leen el mismo archivo. */
export const theme = tokens;

export type ColorToken = keyof typeof tokens.light;
export type PaletteKey = keyof typeof tokens.palette;
export type ThemeMode = 'light' | 'dark';

/** Valores de un modo, para usar en estilos inline o en tests. */
export function colorsFor(mode: ThemeMode): Record<ColorToken, string> {
  return tokens[mode];
}

/** Color de un ítem de cuenta o categoría (paleta de 12 azules). */
export function paletteColor(key: PaletteKey | string | null | undefined): string {
  if (key && key in tokens.palette) {
    return tokens.palette[key as PaletteKey];
  }
  return tokens.light['text-muted'];
}

/** Modo de color activo según el sistema (el toggle manual de Ajustes lo sobreescribe más adelante). */
export function useThemeMode(): ThemeMode {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** Colores del modo activo. */
export function useThemeColors(): Record<ColorToken, string> {
  return colorsFor(useThemeMode());
}
