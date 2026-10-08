import { ScrollView, Text, View } from 'react-native';
import { AmountText, Card, getIcon } from '../../../components/ui';
import { paletteColor } from '../../../theme';
import type { DashboardAccount } from '../types';
import { useIsWide } from '../../../components/layout/useIsWide';

const SYMBOLS: Record<string, string> = { UYU: '$', USD: 'US$', ARS: '$', BRL: 'R$', EUR: '€' };

function AccountCard({ account, hidden }: { account: DashboardAccount; hidden: boolean }) {
  const Icon = getIcon(account.icon);
  const tint = paletteColor(account.color);
  return (
    <Card className="gap-3 p-4" style={{ width: 160 }}>
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${tint}26` }}>
        <Icon size={20} color={tint} />
      </View>
      <Text numberOfLines={1} className="font-sans-semibold text-body text-text">{account.name}</Text>
      <AmountText
        amount={account.balance}
        currency={account.currency}
        symbol={SYMBOLS[account.currency] ?? account.currency}
        hidden={hidden}
      />
    </Card>
  );
}

/** Carrusel horizontal de cuentas en mobile; grilla en web ancho. */
export function AccountsStrip({ accounts, hidden }: { accounts: DashboardAccount[]; hidden: boolean }) {
  const wide = useIsWide();
  if (wide) {
    return (
      <View className="flex-row flex-wrap gap-3">
        {accounts.map((a) => <AccountCard key={a.id} account={a} hidden={hidden} />)}
      </View>
    );
  }
  return (
    <View className="min-w-0"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
      {accounts.map((a) => <AccountCard key={a.id} account={a} hidden={hidden} />)}
    </ScrollView></View>
  );
}
