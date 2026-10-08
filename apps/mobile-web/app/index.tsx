import { View } from 'react-native';
import { EmptyState } from '../src/components/ui';

/** Pantalla provisoria: muestra el estado vacío del tema. Inicio real llega en el módulo de dashboard. */
export default function Index() {
  return (
    <View className="flex-1 justify-center bg-background px-4">
      <EmptyState
        title="Creá tu primera cuenta"
        description="Las cuentas guardan tu saldo a partir de sus movimientos."
        actionLabel="Nueva cuenta"
        onAction={() => undefined}
      />
    </View>
  );
}
