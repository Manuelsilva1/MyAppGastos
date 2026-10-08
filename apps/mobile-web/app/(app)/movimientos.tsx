import { Page } from '../../src/components/layout/Page';
import { EmptyState, Card } from '../../src/components/ui';
import { Text } from 'react-native';

export default function MovimientosScreen() {
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Movimientos</Text>
      <Card className="p-0">
        <EmptyState
          title="Todavía no hay movimientos"
          description="Cargá tu primer gasto con el botón + y va a aparecer acá, agrupado por día."
        />
      </Card>
    </Page>
  );
}
