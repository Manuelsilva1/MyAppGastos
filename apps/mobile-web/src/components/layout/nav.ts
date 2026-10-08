import { CalendarClock, ChartColumn, Ellipsis, House, ReceiptText, Settings, Tags, Wallet, type LucideIcon } from 'lucide-react-native';

export interface NavItem {
  href: '/' | '/movimientos' | '/recurrentes' | '/cuentas' | '/categorias' | '/reportes' | '/ajustes' | '/mas';
  label: string;
  icon: LucideIcon;
}

/** Entradas de la sidebar en web (≥ 1024 px). */
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: House },
  { href: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  { href: '/recurrentes', label: 'Recurrentes', icon: CalendarClock },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/categorias', label: 'Categorías', icon: Tags },
  { href: '/reportes', label: 'Reportes', icon: ChartColumn },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
];

/** Barra inferior en mobile: Inicio, Movimientos, [FAB +], Recurrentes y Más. */
export const TAB_LEFT: NavItem[] = [SIDEBAR_ITEMS[0], SIDEBAR_ITEMS[1]];
export const TAB_RIGHT: NavItem[] = [
  SIDEBAR_ITEMS[2],
  { href: '/mas', label: 'Más', icon: Ellipsis },
];

/** Pantallas que cuelgan de "Más" en mobile. */
export const MORE_ITEMS: NavItem[] = [SIDEBAR_ITEMS[3], SIDEBAR_ITEMS[4], SIDEBAR_ITEMS[5], SIDEBAR_ITEMS[6]];

export const WIDE_BREAKPOINT = 1024;
