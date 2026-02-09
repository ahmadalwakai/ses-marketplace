import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}

export const Screen = ({ children, scroll = true, padded = true }: ScreenProps) => {
  const padding = padded ? spacing.lg : 0;

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: padding, paddingVertical: spacing.lg, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: padding, paddingVertical: spacing.lg, gap: spacing.md }}>{children}</View>
    </SafeAreaView>
  );
};
