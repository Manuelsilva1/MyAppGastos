import { Pressable, Text, type PressableProps } from 'react-native';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected?: boolean;
}

/** Chip con forma completa; el área táctil llega a 44 px de alto con hitSlop. */
export function Chip({ label, selected = false, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={6}
      className={`min-h-[32px] flex-row items-center justify-center rounded-full border px-3 py-1 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-surface active:bg-surface-2'
      }`}
      {...rest}
    >
      <Text className={`font-sans text-caption ${selected ? 'text-on-primary' : 'text-text'}`}>{label}</Text>
    </Pressable>
  );
}
