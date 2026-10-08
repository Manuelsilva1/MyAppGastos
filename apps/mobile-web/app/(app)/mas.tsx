import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Page } from '../../src/components/layout/Page';
import { MORE_ITEMS } from '../../src/components/layout/nav';
import { Card } from '../../src/components/ui';
import { Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../src/theme';

export default function MasScreen() {
  const colors = useThemeColors();
  return (
    <Page>
      <Text className="font-sans-bold text-title text-text">Más</Text>
      <Card className="p-0">
        {MORE_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable accessibilityRole="link" className={`min-h-[56px] flex-row items-center gap-3 px-4 active:bg-surface-2 ${index > 0 ? 'border-t border-border' : ''}`}>
                <Icon size={20} color={colors['text-muted']} />
                <View className="flex-1">
                  <Text className="font-sans-semibold text-body text-text">{item.label}</Text>
                </View>
                <ChevronRight size={18} color={colors['text-muted']} />
              </Pressable>
            </Link>
          );
        })}
      </Card>
    </Page>
  );
}
