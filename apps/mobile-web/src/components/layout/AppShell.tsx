import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Snackbar } from '../ui';
import { BottomTabBar } from './BottomTabBar';
import { QuickEntrySheet, type SavedToast } from './QuickEntrySheet';
import { Sidebar } from './Sidebar';
import { useIsWide } from './useIsWide';

/** Estructura común: sidebar en web ancho, barra inferior en mobile, carga rápida y avisos. */
export function AppShell({ children }: { children: ReactNode }) {
  const wide = useIsWide();
  const [entryOpen, setEntryOpen] = useState(false);
  const [toast, setToast] = useState<SavedToast | null>(null);
  const openEntry = () => setEntryOpen(true);

  return (
    <View className="min-h-full flex-1 bg-background">
      <View className={`flex-1 ${wide ? 'flex-row' : 'flex-col'}`}>
        {wide ? <Sidebar onNewMovement={openEntry} /> : null}
        <View className="min-w-0 flex-1">{children}</View>
      </View>
      {wide ? null : <BottomTabBar onNewMovement={openEntry} />}
      <QuickEntrySheet visible={entryOpen} onClose={() => setEntryOpen(false)} onSaved={setToast} />
      {toast ? (
        <Snackbar
          key={toast.message + Date.now()}
          message={toast.message}
          actionLabel={toast.onUndo ? 'Deshacer' : undefined}
          onAction={toast.onUndo}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </View>
  );
}
