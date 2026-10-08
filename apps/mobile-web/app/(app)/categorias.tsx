import { Text } from 'react-native';
import { Page } from '../../src/components/layout/Page';
import { Card, EmptyState } from '../../src/components/ui';

export default function CategoríasScreen() {
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Categorías</Text>
      <Card className="p-0">
        <EmptyState title="Todavía no hay categorías" description="Se crean un set por defecto al registrarte; acá las podés editar." />
      </Card>
    </Page>
  );
}
