import { Pressable, Text, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { AmountText, Card } from '../../../components/ui';
import { useThemeColors } from '../../../theme';

export interface NetWorthCardProps {
  amount: string;
  currency: string;
  symbol: string;
  change: string | null;
  hidden: boolean;
  onToggleHidden: () => void;
}

/** Patrimonio en estilo display, con la variación contra el mes anterior y el ojo para ocultar montos. */
export function NetWorthCard({ amount, currency, symbol, change, hidden, onToggleHidden }: NetWorthCardProps) {
  const colors = useThemeColors();
  const positive = change !== null && !change.startsWith('-');
  return (
    <Card className="gap-2 p-5">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-overline uppercase tracking-[0.5px] text-text-muted">
          Patrimonio · {currency}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar montos' : 'Ocultar montos'}
          onPress={onToggleHidden}
          hitSlop={8}
          className="min-h-[44px] min-w-[44px] items-center justify-center"
        >
          {hidden ? <EyeOff size={20} color={colors['text-muted']} /> : <Eye size={20} color={colors['text-muted']} />}
        </Pressable>
      </View>
      <AmountText amount={amount} currency={currency} symbol={symbol} variant="display" hidden={hidden} />
      {change !== null ? (
        <Text className={`font-sans text-caption ${positive ? 'text-income' : 'text-expense'}`}>
          {positive ? '+' : ''}
          {change.replace('.', ',')}% vs. mes anterior
        </Text>
      ) : null}
    </Card>
  );
}
