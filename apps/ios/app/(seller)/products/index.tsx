import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { useSellerStore } from '../../../src/lib/store/seller';
import { colors, spacing, typography } from '../../../src/theme/tokens';

export default function SellerProducts() {
  const router = useRouter();
  const fetchProducts = useSellerStore((state) => state.fetchProducts);
  const products = useSellerStore((state) => state.products);
  const loading = useSellerStore((state) => state.loading);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      <Button title="منتج جديد" onPress={() => router.push('/(seller)/products/new')} />
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm }}
          ListEmptyComponent={<Text style={{ color: colors.text, textAlign: 'center', padding: spacing.lg }}>لا توجد منتجات بعد. أضف منتجك الأول!</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(seller)/products/${item.id}`)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>{item.name}</Text>
                  {item.price != null && <Text style={{ color: colors.text }}>السعر: {item.price} ر.س</Text>}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}
