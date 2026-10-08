import { Pressable, Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { SIDEBAR_ITEMS } from './nav';
import { useThemeColors } from '../../theme';

export interface SidebarProps {
  onNewMovement: () => void;
}

/** Sidebar fija a la izquierda, solo en web de escritorio. */
export function Sidebar({ onNewMovement }: SidebarProps) {
  const pathname = usePathname();
  const colors = useThemeColors();
  return (
    <View className="w-60 border-r border-border bg-surface px-4 py-6">
      <Text className="mb-6 px-2 font-sans-bold text-title text-primary">Finanzas</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo movimiento"
        onPress={onNewMovement}
        className="mb-6 min-h-[44px] flex-row items-center justify-center gap-2 rounded-input bg-primary px-4 active:opacity-90"
      >
        <Plus size={18} color={colors['on-primary']} />
        <Text className="font-sans-semibold text-body text-on-primary">Nuevo movimiento</Text>
      </Pressable>

      <View className="gap-1">
        {SIDEBAR_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                className={`min-h-[44px] flex-row items-center gap-3 rounded-input px-3 ${
                  active ? 'bg-surface-2' : 'active:bg-surface-2'
                }`}
              >
                <Icon size={18} color={active ? colors.primary : colors['text-muted']} />
                <Text className={`font-sans-semibold text-body ${active ? 'text-primary' : 'text-text'}`}>
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
