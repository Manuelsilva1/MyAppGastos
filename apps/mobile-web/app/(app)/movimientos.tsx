import { Pressable, Text, View } from 'react-native';
import { Page } from '../../src/components/layout/Page';
import { AmountText, Button, Card, EmptyState, getIcon } from '../../src/components/ui';
import { useTransactions, type TransactionItem } from '../../src/features/transactions/useTransactions';
import { useThemeColors } from '../../src/theme';

function kindOf(type: TransactionItem['type']): 'income' | 'expense' | 'transfer' | 'neutral' {
  if (type === 'INCOME') return 'income';
  if (type === 'EXPENSE') return 'expense';
  if (type === 'TRANSFER_IN' || type === 'TRANSFER_OUT') return 'transfer';
  return 'neutral';
}

function Row({ item }: { item: TransactionItem }) {
  const colors = useThemeColors();
  const Icon = getIcon('receipt-text');
  return (
    <View className="min-h-[44px] flex-row items-center gap-3 py-2">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <Icon size={18} color={colors['text-muted']} />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-sans-semibold text-body text-text">
          {item.description ?? 'Sin descripción'}
        </Text>
        <Text className="font-sans text-caption text-text-muted">{item.occurredOn}</Text>
      </View>
      <AmountText amount={item.amount} currency="UYU" symbol="$" kind={kindOf(item.type)} />
    </View>
  );
}

/** Listado de movimientos con paginación keyset. */
export default function MovimientosScreen() {
  const { data, isPending, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useTransactions();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Movimientos</Text>
      {isError ? (
        <Card className="items-start gap-3">
          <Text className="font-sans-semibold text-heading text-text">No pudimos cargar los movimientos</Text>
          <Text className="font-sans text-caption text-text-muted">{error instanceof Error ? error.message : ''}</Text>
          <Button label="Reintentar" variant="secondary" onPress={() => refetch()} />
        </Card>
      ) : null}
      {!isPending && !isError && items.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="Todavía no hay movimientos"
            description="Cargá tu primer gasto con el botón + y va a aparecer acá."
          />
        </Card>
      ) : null}
      {items.length > 0 ? (
        <Card className="gap-1">
          {items.map((item) => <Row key={item.id} item={item} />)}
          {hasNextPage ? (
            <Pressable accessibilityRole="button" onPress={() => fetchNextPage()} className="min-h-[44px] items-center justify-center">
              <Text className="font-sans-semibold text-caption text-primary">
                {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
              </Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </Page>
  );
}
