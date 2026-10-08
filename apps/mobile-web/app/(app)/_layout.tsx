import { Slot } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';

/** Todas las secciones comparten la sidebar (web) o la barra inferior (mobile). */
export default function AppLayout() {
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
