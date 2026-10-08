import { Text } from 'react-native';
import { Page } from '../../src/components/layout/Page';
import { Card, EmptyState } from '../../src/components/ui';

export default function AjustesScreen() {
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Ajustes</Text>
      <Card className="p-0">
        <EmptyState title="Ajustes" description="El modo oscuro sigue al sistema; el interruptor manual llega con las preferencias." />
      </Card>
    </Page>
  );
}
