import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Page } from '../../src/components/layout/Page';
import { Card, EmptyState } from '../../src/components/ui';

const TABS = ['Pendientes', 'Reglas'] as const;

export default function RecurrentesScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Pendientes');
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Recurrentes</Text>
      <View className="flex-row rounded-input bg-surface-2 p-1">
        {TABS.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => setTab(t)}
            className={`min-h-[44px] flex-1 items-center justify-center rounded-input ${tab === t ? 'bg-surface' : ''}`}
          >
            <Text className={`font-sans-semibold text-caption ${tab === t ? 'text-text' : 'text-text-muted'}`}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Card className="p-0">
        <EmptyState
          title={tab === 'Pendientes' ? 'No hay vencimientos pendientes' : 'Todavía no hay reglas'}
          description="Los gastos fijos como el alquiler o los ingresos como el sueldo se cargan una vez y se confirman con un toque."
        />
      </Card>
    </Page>
  );
}
