import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ArrowLeftRight } from 'lucide-react-native';
import { AmountText, Card, getIcon } from '../../../components/ui';
import { useThemeColors } from '../../../theme';
import type { DashboardSummary } from '../types';

type Recent = DashboardSummary['recentTransactions'][number];

function kindOf(t: Recent['type']): 'income' | 'expense' | 'transfer' | 'neutral' {
  if (t === 'INCOME') return 'income';
  if (t === 'EXPENSE') return 'expense';
  if (t === 'TRANSFER_IN' || t === 'TRANSFER_OUT') return 'transfer';
  return 'neutral';
}

function Row({ item }: { item: Recent }) {
  const colors = useThemeColors();
  const isTransfer = item.type === 'TRANSFER_IN' || item.type === 'TRANSFER_OUT';
  const Icon = isTransfer ? ArrowLeftRight : getIcon('receipt-text');
  const tint = isTransfer ? colors.transfer : colors['text-muted'];
  return (
    <View className="min-h-[44px] flex-row items-center gap-3 py-2">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <Icon size={18} color={tint} />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-sans-semibold text-body text-text">
          {item.description ?? item.categoryName ?? 'Transferencia'}
        </Text>
        <Text numberOfLines={1} className="font-sans text-caption text-text-muted">{item.accountName}</Text>
      </View>
      <AmountText amount={item.amount} currency={item.currency} symbol="$" kind={kindOf(item.type)} />
    </View>
  );
}

export function RecentList({ items }: { items: Recent[] }) {
  return (
    <Card className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-heading text-text">Últimos movimientos</Text>
        <Link href="/movimientos" asChild>
          <Pressable accessibilityRole="link" className="min-h-[44px] justify-center">
            <Text className="font-sans-semibold text-caption text-primary">Ver todos</Text>
          </Pressable>
        </Link>
      </View>
      {items.slice(0, 5).map((item) => <Row key={item.id} item={item} />)}
    </Card>
  );
}
