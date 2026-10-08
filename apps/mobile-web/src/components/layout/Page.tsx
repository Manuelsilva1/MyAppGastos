import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useIsWide } from './useIsWide';

/** Contenedor de pantalla: padding 16 en mobile, 24 en web y ancho máximo 1200 px. */
export function Page({ children }: { children: ReactNode }) {
  const wide = useIsWide();
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingHorizontal: wide ? 24 : 16, paddingVertical: wide ? 24 : 16, paddingBottom: 120 }}
    >
      <View className="w-full min-w-0 max-w-[1200px] self-center gap-4">{children}</View>
    </ScrollView>
  );
}
