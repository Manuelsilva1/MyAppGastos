import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, type DimensionValue, View } from 'react-native';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Radio de esquina; por defecto, el de input. */
  radius?: number;
}

/** Placeholder con la forma del contenido. Pulsa suavemente salvo con "reducir movimiento". */
export function Skeleton({ width = '100%', height = 16, radius = 10 }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!active || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.5, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      active = false;
      loop?.stop();
    };
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radius, opacity: pulse }}
      className="bg-surface-2"
    >
      <View />
    </Animated.View>
  );
}
