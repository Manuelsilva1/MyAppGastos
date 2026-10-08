import { View, type ViewProps } from 'react-native';

/** Card con borde de 1 px y sin sombra (la elevación solo se usa en el FAB y los bottom sheets). */
export function Card({ className = '', children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={`rounded-card border border-border bg-surface p-4 ${className}`} {...rest}>
      {children}
    </View>
  );
}
