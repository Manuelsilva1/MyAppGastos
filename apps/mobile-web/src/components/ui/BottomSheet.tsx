import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Título accesible del diálogo. */
  accessibilityLabel?: string;
}

const DURATION_MS = 180; // dentro del rango 150–200 ms de la especificación
const WEB_DIALOG_MIN_WIDTH = 1024; // en web ≥ 1024 px el sheet es un modal centrado

/**
 * Bottom sheet en mobile; modal centrado en web ancho.
 * Anima entrada y salida con ease-out y respeta "reducir movimiento" del sistema.
 */
export function BottomSheet({ visible, onClose, children, accessibilityLabel }: BottomSheetProps) {
  const { width } = useWindowDimensions();
  const asDialog = Platform.OS === 'web' && width >= WEB_DIALOG_MIN_WIDTH;
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) reduceMotion.current = enabled;
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion.current ? 0 : DURATION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, progress]);

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [asDialog ? 0 : 400, 0] });
  const opacity = progress;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View className={`flex-1 ${asDialog ? 'items-center justify-center' : 'justify-end'}`}>
        <Animated.View style={{ opacity }} className="absolute inset-0 bg-black/40">
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" className="flex-1" onPress={onClose} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={{ transform: [{ translateY }], opacity }}
          className={`bg-surface border border-border px-4 pb-8 pt-3 shadow-sm ${
            asDialog ? 'w-[520px] rounded-sheet' : 'w-full rounded-t-sheet'
          }`}
        >
          {!asDialog ? <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" /> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
