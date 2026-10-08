import { ActivityIndicator, Pressable, Text, type PressableProps, View } from 'react-native';
import { useThemeColors } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const container: Record<Variant, string> = {
  primary: 'bg-primary active:opacity-90',
  secondary: 'bg-surface-2 border border-border active:opacity-80',
  ghost: 'bg-transparent active:bg-surface-2',
  danger: 'bg-danger/15 active:opacity-80',
};

const labelColor: Record<Variant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-text',
  ghost: 'text-primary',
  danger: 'text-danger',
};

/** Botón con área táctil mínima de 44 px. */
export function Button({ label, variant = 'primary', loading = false, fullWidth = false, disabled, ...rest }: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`min-h-[44px] min-w-[44px] flex-row items-center justify-center rounded-input px-4 ${container[variant]} ${
        fullWidth ? 'w-full' : 'self-start'
      } ${isDisabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      <View className="flex-row items-center gap-2">
        {loading ? <ActivityIndicator size="small" color={variant === 'primary' ? colors['on-primary'] : colors.text} /> : null}
        <Text className={`font-sans-semibold text-body ${labelColor[variant]}`}>{label}</Text>
      </View>
    </Pressable>
  );
}
