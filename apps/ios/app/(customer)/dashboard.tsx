import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/lib/store/auth';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Screen>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>
            أهلاً، {user?.name || 'عميلنا العزيز'}
          </Text>
          <Text style={{ color: colors.text }}>تابع طلباتك وقوائمك بسهولة.</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button title="طلباتي" onPress={() => router.push('/(customer)/orders')} />
            <Button title="المفضلة" variant="outline" onPress={() => router.push('/(customer)/wishlist')} />
            <Button title="المقارنة" variant="ghost" onPress={() => router.push('/(customer)/compare')} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
