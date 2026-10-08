import { Redirect, Slot } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { useSession } from '../../src/features/auth/session';
import { IS_DEMO } from '../../src/lib/config';

/** Todas las secciones comparten la sidebar (web) o la barra inferior (mobile). Exige sesión salvo en modo ejemplo. */
export default function AppLayout() {
  const ready = useSession((s) => s.ready);
  const accessToken = useSession((s) => s.accessToken);
  if (!ready) return null;
  if (!IS_DEMO && !accessToken) return <Redirect href="/login" />;
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
