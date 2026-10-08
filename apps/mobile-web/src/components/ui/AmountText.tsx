import { Text, View } from 'react-native';
import { ArrowLeftRight } from 'lucide-react-native';
import { formatMoney } from '@finanzas/shared';
import { useThemeColors } from '../../theme';

export type AmountKind = 'income' | 'expense' | 'transfer' | 'neutral';
export type AmountVariant = 'display' | 'title' | 'body';

export interface AmountTextProps {
  /** Monto como string, con signo tal como está guardado (negativo = salida). Nunca un number. */
  amount: string;
  currency: string;
  /** Símbolo de la moneda, por ejemplo "$" o "US$". */
  symbol: string;
  decimals?: number;
  kind?: AmountKind;
  variant?: AmountVariant;
  /** Oculta el monto (ícono de ojo del dashboard): se muestra "$ •••••". */
  hidden?: boolean;
}

const sizeClass: Record<AmountVariant, string> = {
  display: 'text-display font-sans-bold',
  title: 'text-title font-sans-semibold',
  body: 'text-body font-sans',
};

const colorClass: Record<AmountKind, string> = {
  income: 'text-income',
  expense: 'text-expense',
  transfer: 'text-text',
  neutral: 'text-text',
};

/**
 * Monto con formato es-UY y cifras tabulares.
 * Gasto: "− $ 450,00" en expense. Ingreso: "+ $ 32.000,00" en income.
 * Transferencia: monto en text con ícono de flechas en transfer.
 */
export function AmountText({
  amount,
  symbol,
  decimals = 2,
  kind = 'neutral',
  variant = 'body',
  hidden = false,
  currency,
}: AmountTextProps) {
  const colors = useThemeColors();
  const magnitude = amount.startsWith('-') ? amount.slice(1) : amount;

  let text: string;
  if (hidden) {
    text = `${symbol} •••••`;
  } else if (kind === 'expense') {
    text = formatMoney(`-${magnitude}`, { symbol, decimals, signMode: 'explicit' });
  } else if (kind === 'income') {
    text = formatMoney(magnitude, { symbol, decimals, signMode: 'explicit' });
  } else {
    text = formatMoney(amount, { symbol, decimals, signMode: 'negative-only' });
  }

  const label = hidden ? 'Monto oculto' : `${currency} ${text}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      className="flex-row items-center gap-1"
    >
      {kind === 'transfer' && !hidden ? <ArrowLeftRight size={16} color={colors.transfer} /> : null}
      <Text
        style={{ fontVariant: ['tabular-nums'] }}
        className={`${sizeClass[variant]} ${kind === 'transfer' ? 'text-text' : colorClass[kind]}`}
      >
        {text}
      </Text>
    </View>
  );
}
