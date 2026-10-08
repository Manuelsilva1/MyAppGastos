import { Text, View } from 'react-native';
import { AmountText, Card } from '../../../components/ui';
import { relativeDue } from '../format';
import type { DashboardSummary } from '../types';

type Upcoming = DashboardSummary['upcoming'][number];

function Row({ item }: { item: Upcoming }) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-sans-semibold text-body text-text">{item.ruleName}</Text>
        <Text className="font-sans text-caption text-text-muted">{relativeDue(item.daysUntil)}</Text>
      </View>
      <AmountText amount={`-${item.expectedAmount}`} currency="UYU" symbol="$" kind="expense" />
      {/* Ámbar como fondo, texto oscuro: cumple contraste aunque el ámbar como texto no. */}
      <View className={`rounded-full px-2 py-0.5 ${item.overdue ? 'bg-danger/15' : 'bg-pending/25'}`}>
        <Text className={`font-sans-semibold text-overline ${item.overdue ? 'text-danger' : 'text-text'}`}>
          {item.overdue ? 'Vencido' : 'Pendiente'}
        </Text>
      </View>
    </View>
  );
}

export function UpcomingList({ items }: { items: Upcoming[] }) {
  return (
    <Card className="gap-1">
      <Text className="font-sans-semibold text-heading text-text">Próximos vencimientos</Text>
      {items.slice(0, 5).map((item) => <Row key={item.id} item={item} />)}
    </Card>
  );
}
