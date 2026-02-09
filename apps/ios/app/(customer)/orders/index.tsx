import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Order {
  id: string;
  status: string;
  total: number;
}

export default function CustomerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get<Order[]>('/api/orders/me', { authCookie: getAuthCookie() || undefined });
        setOrders(data || []);
      } catch {
        // API error handled silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Screen scroll={false}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(customer)/orders/${item.id}`)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>
                    طلب #{item.id}
                  </Text>
                  <Text style={{ color: colors.text }}>الحالة: {item.status}</Text>
                  <Text style={{ color: colors.text }}>الإجمالي: {item.total} ر.س</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}
