import { Text } from 'react-native';
import { Page } from '../../src/components/layout/Page';
import { Card, EmptyState } from '../../src/components/ui';

export default function ReportesScreen() {
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Reportes</Text>
      <Card className="p-0">
        <EmptyState title="Reportes próximamente" description="Evolución mensual, gasto por categoría y flujo de caja proyectado." />
      </Card>
    </Page>
  );
}
