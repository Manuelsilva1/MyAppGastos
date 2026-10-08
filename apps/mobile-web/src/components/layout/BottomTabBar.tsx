import { Pressable, Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { TAB_LEFT, TAB_RIGHT, type NavItem } from './nav';
import { useThemeColors } from '../../theme';

export interface BottomTabBarProps {
  onNewMovement: () => void;
}

function TabItem({ item, active }: { item: NavItem; active: boolean }) {
  const colors = useThemeColors();
  const Icon = item.icon;
  const tint = active ? colors.primary : colors['text-muted'];
  return (
    <Link href={item.href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={item.label} accessibilityState={{ selected: active }}
        className="min-h-[44px] flex-1 items-center justify-center gap-1">
        <Icon size={22} color={tint} />
        <Text className="font-sans text-overline" style={{ color: tint }}>{item.label}</Text>
      </Pressable>
    </Link>
  );
}

/** Barra inferior de mobile con el botón central de carga rápida. */
export function BottomTabBar({ onNewMovement }: BottomTabBarProps) {
  const pathname = usePathname();
  const isActive = (item: NavItem) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href));
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center border-t border-border bg-surface px-2 pb-6 pt-2">
      {TAB_LEFT.map((item) => <TabItem key={item.href} item={item} active={isActive(item)} />)}
      <View className="flex-1 items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nuevo movimiento"
          onPress={onNewMovement}
          className="-mt-8 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md active:opacity-90"
        >
          <Plus size={26} color={colors['on-primary']} />
        </Pressable>
      </View>
      {TAB_RIGHT.map((item) => <TabItem key={item.href} item={item} active={isActive(item)} />)}
    </View>
  );
}
