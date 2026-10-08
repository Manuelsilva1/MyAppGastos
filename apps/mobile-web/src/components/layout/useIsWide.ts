import { useWindowDimensions } from 'react-native';
import { WIDE_BREAKPOINT } from './nav';

/** true en web de escritorio (≥ 1024 px): se muestra la sidebar en lugar de la barra inferior. */
export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}
