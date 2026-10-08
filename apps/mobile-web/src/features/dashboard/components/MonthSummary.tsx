import { Text, View } from 'react-native';
import { compareMoney } from '@finanzas/shared';
import { AmountText, Card } from '../../../components/ui';
import { paletteColor } from '../../../theme';
import { barPercent, shareToPercent } from '../format';
import type { DashboardSummary } from '../types';

const SYMBOL = '$';

function Bar({ label, value, max, color }: { label: string; value: string; max: string; color: string }) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-caption text-text-muted">{label}</Text>
        <AmountText amount={value} currency="UYU" symbol={SYMBOL} kind="neutral" />
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface-2">
        <View className="h-2 rounded-full" style={{ width: `${barPercent(value, max)}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

/** "Este mes": ingresos contra gastos con el neto, y el top 3 de categorías con barra de progreso. */
export function MonthSummary({ summary }: { summary: DashboardSummary['thisMonth'] }) {
  // Comparación exacta sobre el string del monto, sin number.
  const max = compareMoney(summary.income, summary.expense) >= 0 ? summary.income : summary.expense;
  return (
    <Card className="gap-5">
      <Text className="font-sans-semibold text-heading text-text">Este mes</Text>
      <View className="gap-3">
        <Bar label="Ingresos" value={summary.income} max={max} color={paletteColor('azul-06')} />
        <Bar label="Gastos" value={summary.expense} max={max} color={paletteColor('azul-01')} />
      </View>
      <View className="flex-row items-center justify-between rounded-input bg-surface-2 px-3 py-2">
        <Text className="font-sans text-caption text-text-muted">Neto</Text>
        <AmountText amount={summary.net} currency="UYU" symbol={SYMBOL} kind="neutral" variant="body" />
      </View>
      <View className="gap-3">
        {summary.topCategories.map((c) => (
          <View key={c.categoryId} className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-semibold text-caption text-text">{c.name}</Text>
              <AmountText amount={`-${c.amount}`} currency="UYU" symbol={SYMBOL} kind="expense" />
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <View className="h-1.5 rounded-full bg-primary" style={{ width: `${shareToPercent(c.share)}%` }} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
