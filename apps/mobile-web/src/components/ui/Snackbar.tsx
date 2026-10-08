import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface SnackbarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  /** Tiempo visible en ms. Por defecto, 5 s como en la carga rápida. */
  durationMs?: number;
}

/**
 * Snackbar inferior con acción opcional ("Deshacer").
 * Se cierra solo al cumplirse durationMs; un re-render del padre no reinicia el temporizador.
 */
export function Snackbar({ message, actionLabel, onAction, onDismiss, durationMs = 5000 }: SnackbarProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => dismissRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, message]);

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute bottom-24 left-4 right-4 flex-row items-center gap-3 rounded-input border border-border bg-surface-2 px-4 py-3 web:self-center web:max-w-[560px]"
    >
      <Text className="flex-1 font-sans text-body text-text">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            onAction();
            dismissRef.current();
          }}
          hitSlop={8}
          className="min-h-[44px] justify-center px-2"
        >
          <Text className="font-sans-semibold text-body text-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
