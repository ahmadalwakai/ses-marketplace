import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Order {
  id: string;
  status: string;
  total: number;
  items?: { name: string; quantity: number }[];
  customer?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

export default function SellerOrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<Order>(`/api/seller/orders/${id}`, { authCookie: getAuthCookie() || undefined });
        setOrder(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/api/seller/orders/${id}/status`, { status }, { authCookie: getAuthCookie() || undefined });
      setOrder((prev) => prev ? { ...prev, status } : prev);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
        <Text style={{ color: colors.text }}>لا توجد بيانات لهذا الطلب.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      <Card>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>طلب #{order.id.slice(0, 8)}</Text>
          <Text style={{ color: colors.text }}>الحالة: {statusLabels[order.status] || order.status}</Text>
          <Text style={{ color: colors.text }}>الإجمالي: {order.total} ر.س</Text>
          {order.customer && <Text style={{ color: colors.text }}>العميل: {order.customer}</Text>}
          {order.items?.length ? (
            <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
              {order.items.map((item, idx) => (
                <Text key={idx} style={{ color: colors.text }}>
                  {item.name} × {item.quantity}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </Card>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>تحديث حالة الطلب</Text>
          {(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => (
            <Button key={s} title={statusLabels[s]} variant={order.status === s ? 'primary' : 'outline'} onPress={() => updateStatus(s)} loading={updating} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}
