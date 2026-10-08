import * as Lucide from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

/**
 * Convierte el nombre de ícono guardado en la base ("shopping-cart") al componente de lucide ("ShoppingCart").
 * Si el nombre no existe, devuelve el ícono de etiqueta para no romper la lista.
 */
export function getIcon(name: string | null | undefined): LucideIcon {
  const pascal = (name ?? '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return (Lucide as unknown as Record<string, LucideIcon | undefined>)[pascal] ?? Lucide.Tag;
}
