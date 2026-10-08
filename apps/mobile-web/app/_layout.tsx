import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useSession } from '../src/features/auth/session';

export default function RootLayout() {
  // Inter cargada antes de pintar: sin esto, el texto usa la fuente del sistema.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const hydrate = useSession((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  // Una instancia por montaje: el cache de TanStack Query vive mientras la app esté abierta.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 2, staleTime: 30_000 },
        },
      }),
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
    </QueryClientProvider>
  );
}
