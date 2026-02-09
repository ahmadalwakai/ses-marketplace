import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Order {
  id: string;
  status: string;
  total: number;
  items?: { name: string; quantity: number }[];
}

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<Order>(`/api/orders/${id}`, { authCookie: getAuthCookie() || undefined });
        setOrder(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>لم يتم العثور على الطلب.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>طلب #{order.id}</Text>
          <Text style={{ color: colors.text }}>الحالة: {order.status}</Text>
          <Text style={{ color: colors.text }}>الإجمالي: {order.total} ر.س</Text>
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
    </Screen>
  );
}
