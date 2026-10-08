import type { ReactNode } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { getIcon } from './icon';
import { paletteColor } from '../../theme';

export interface ListItemProps extends Omit<PressableProps, 'children'> {
  title: string;
  /** Texto secundario (caption), por ejemplo la cuenta. */
  subtitle?: string;
  /** Nombre de ícono guardado en la base, por ejemplo "shopping-cart". */
  icon?: string | null;
  /** Clave de la paleta de 12 azules para tintar el círculo. */
  color?: string | null;
  /** Monto u otro dato alineado a la derecha. */
  trailing?: ReactNode;
}

/** Ítem de lista con ícono de categoría en un círculo tintado al 15 %. */
export function ListItem({ title, subtitle, icon, color, trailing, onPress, ...rest }: ListItemProps) {
  const Icon = getIcon(icon);
  const tint = paletteColor(color);
  const content = (
    <View className="min-h-[44px] flex-row items-center gap-3 py-2">
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${tint}26` }}
      >
        <Icon size={20} color={tint} />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-sans-semibold text-body text-text">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="font-sans text-caption text-text-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) {
    return <View accessibilityLabel={title}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="active:bg-surface-2"
      {...rest}
    >
      {content}
    </Pressable>
  );
}
