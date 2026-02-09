import { useEffect } from 'react';
import { ActivityIndicator, Text, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { useSellerStore } from '../../src/lib/store/seller';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function Earnings() {
  const router = useRouter();
  const earnings = useSellerStore((state) => state.earnings);
  const loading = useSellerStore((state) => state.loading);
  const fetchEarnings = useSellerStore((state) => state.fetchEarnings);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <Screen>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Card>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>إجمالي الأرباح</Text>
            <Text style={{ fontSize: typography.heading, fontWeight: '800', color: colors.text }}>{earnings} ر.س</Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}
