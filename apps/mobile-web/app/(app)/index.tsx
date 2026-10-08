import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../src/components/ui';
import { Page } from '../../src/components/layout/Page';
import { useIsWide } from '../../src/components/layout/useIsWide';
import { AccountsStrip } from '../../src/features/dashboard/components/AccountsStrip';
import { MonthSummary } from '../../src/features/dashboard/components/MonthSummary';
import { NetWorthCard } from '../../src/features/dashboard/components/NetWorthCard';
import { RecentList } from '../../src/features/dashboard/components/RecentList';
import { UpcomingList } from '../../src/features/dashboard/components/UpcomingList';
import { useDashboard } from '../../src/features/dashboard/useDashboard';
import { IS_DEMO } from '../../src/lib/config';
import { Skeleton } from '../../src/components/ui';

function HomeSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={140} radius={16} />
      <Skeleton height={96} radius={16} />
      <Skeleton height={220} radius={16} />
    </View>
  );
}

/** Inicio: patrimonio, cuentas, este mes, próximos vencimientos y últimos movimientos. */
export default function HomeScreen() {
  const { data, isPending, isError, error, refetch } = useDashboard();
  const wide = useIsWide();
  const [hidden, setHidden] = useState(false);

  return (
    <Page>
      {IS_DEMO ? (
        <Text className="rounded-input bg-pending/25 px-3 py-2 font-sans text-caption text-text">
          Datos de ejemplo: la API todavía no está conectada.
        </Text>
      ) : null}

      {isPending ? <HomeSkeleton /> : null}

      {isError ? (
        <View className="items-start gap-3 rounded-card border border-border bg-surface p-4">
          <Text className="font-sans-semibold text-heading text-text">No pudimos cargar el resumen</Text>
          <Text className="font-sans text-caption text-text-muted">{error instanceof Error ? error.message : ''}</Text>
          <Button label="Reintentar" variant="secondary" onPress={() => refetch()} />
        </View>
      ) : null}

      {data ? (
        <View className={wide ? 'flex-row items-start gap-4' : 'gap-4'}>
          <View className={wide ? 'flex-1 gap-4' : 'gap-4'}>
            <NetWorthCard
              amount={data.netWorth.amount}
              currency={data.netWorth.currency}
              symbol="$"
              change={data.netWorth.changeVsPreviousMonth}
              hidden={hidden}
              onToggleHidden={() => setHidden((h) => !h)}
            />
            <View className="gap-2">
              <Text className="font-sans-semibold text-heading text-text">Cuentas</Text>
              <AccountsStrip accounts={data.accounts} hidden={hidden} />
            </View>
            <RecentList items={data.recentTransactions} />
          </View>
          <View className={wide ? 'w-[380px] gap-4' : 'gap-4'}>
            <MonthSummary summary={data.thisMonth} />
            <UpcomingList items={data.upcoming} />
          </View>
        </View>
      ) : null}
    </Page>
  );
}
