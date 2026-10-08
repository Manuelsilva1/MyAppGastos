import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Almacenamiento del token: SecureStore en iOS y Android; en web, localStorage del navegador
 * (no hay almacenamiento seguro nativo). Cada operación falla en silencio si el navegador
 * bloquea el almacenamiento: la app sigue, pero hay que volver a iniciar sesión.
 */
const KEY = 'finanzas.session';

export async function readSession(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    }
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function writeSession(value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Sin almacenamiento disponible la sesión dura lo que la pestaña.
  }
}

export async function clearSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nada que borrar.
  }
}
