import { Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { Button } from './Button';
import { useThemeColors } from '../../theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Estado vacío: ilustración de línea simple, una frase y un botón de acción. */
export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-3 px-6 py-12" accessibilityRole="summary">
      <Inbox size={48} strokeWidth={1.5} color={colors['text-muted']} />
      <Text className="text-center font-sans-semibold text-heading text-text">{title}</Text>
      {description ? <Text className="text-center font-sans text-caption text-text-muted">{description}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
