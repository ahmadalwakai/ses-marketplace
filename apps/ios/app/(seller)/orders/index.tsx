import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Order {
  id: string;
  status: string;
  total: number;
  customer?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

export default function SellerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get<Order[]>('/api/seller/orders', { authCookie: getAuthCookie() || undefined });
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
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm }}
          ListEmptyComponent={<Text style={{ color: colors.text, textAlign: 'center', padding: spacing.lg }}>لا توجد طلبات بعد.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(seller)/orders/${item.id}`)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>طلب #{item.id.slice(0, 8)}</Text>
                  <Text style={{ color: colors.text }}>الحالة: {statusLabels[item.status] || item.status}</Text>
                  <Text style={{ color: colors.text }}>الإجمالي: {item.total} ر.س</Text>
                  {item.customer && <Text style={{ color: colors.text }}>العميل: {item.customer}</Text>}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}
