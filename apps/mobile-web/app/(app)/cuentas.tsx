import { Text } from 'react-native';
import { Page } from '../../src/components/layout/Page';
import { Card, EmptyState } from '../../src/components/ui';

export default function CuentasScreen() {
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Cuentas</Text>
      <Card className="p-0">
        <EmptyState title="Creá tu primera cuenta" description="Las cuentas guardan su saldo a partir de sus movimientos." />
      </Card>
    </Page>
  );
}
