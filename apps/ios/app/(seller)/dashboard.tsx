import { useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useSellerStore } from '../../src/lib/store/seller';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function SellerDashboard() {
  const router = useRouter();
  const fetchProducts = useSellerStore((state) => state.fetchProducts);
  const fetchOrders = useSellerStore((state) => state.fetchOrders);
  const fetchEarnings = useSellerStore((state) => state.fetchEarnings);
  const products = useSellerStore((state) => state.products);
  const orders = useSellerStore((state) => state.orders);
  const earnings = useSellerStore((state) => state.earnings);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchEarnings();
  }, [fetchProducts, fetchOrders, fetchEarnings]);

  return (
    <Screen>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>مرحبا أيها البائع</Text>
          <Text style={{ color: colors.text }}>أدر متجرك، منتجاتك، وطلباتك بسهولة.</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button title="منتجاتي" onPress={() => router.push('/(seller)/products')} />
            <Button title="إضافة منتج" variant="outline" onPress={() => router.push('/(seller)/products/new')} />
            <Button title="طلبات" variant="outline" onPress={() => router.push('/(seller)/orders')} />
            <Button title="الأرباح" variant="ghost" onPress={() => router.push('/(seller)/earnings')} />
          </View>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Card>
          <View style={{ padding: spacing.sm }}>
            <Text style={{ color: colors.text }}>المنتجات</Text>
            <Text style={{ color: colors.text, fontSize: typography.heading, fontWeight: '700' }}>{products.length}</Text>
          </View>
        </Card>
        <Card>
          <View style={{ padding: spacing.sm }}>
            <Text style={{ color: colors.text }}>الطلبات</Text>
            <Text style={{ color: colors.text, fontSize: typography.heading, fontWeight: '700' }}>{orders.length}</Text>
          </View>
        </Card>
        <Card>
          <View style={{ padding: spacing.sm }}>
            <Text style={{ color: colors.text }}>الأرباح</Text>
            <Text style={{ color: colors.text, fontSize: typography.heading, fontWeight: '700' }}>{earnings} ر.س</Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
