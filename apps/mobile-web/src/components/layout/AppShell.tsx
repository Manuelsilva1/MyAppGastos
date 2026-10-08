import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { BottomTabBar } from './BottomTabBar';
import { QuickEntrySheet } from './QuickEntrySheet';
import { Sidebar } from './Sidebar';
import { useIsWide } from './useIsWide';

/** Estructura común: sidebar en web ancho, barra inferior en mobile, y la carga rápida sobre todo. */
export function AppShell({ children }: { children: ReactNode }) {
  const wide = useIsWide();
  const [entryOpen, setEntryOpen] = useState(false);
  const openEntry = () => setEntryOpen(true);

  return (
    <View className="min-h-full flex-1 bg-background">
      <View className={`flex-1 ${wide ? 'flex-row' : 'flex-col'}`}>
        {wide ? <Sidebar onNewMovement={openEntry} /> : null}
        <View className="min-w-0 flex-1">{children}</View>
      </View>
      {wide ? null : <BottomTabBar onNewMovement={openEntry} />}
      <QuickEntrySheet visible={entryOpen} onClose={() => setEntryOpen(false)} />
    </View>
  );
}
