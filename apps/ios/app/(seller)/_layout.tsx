import { Stack } from 'expo-router';
import { colors } from '../../src/theme/tokens';

export default function SellerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'لوحة البائع' }} />
      <Stack.Screen name="products/index" options={{ title: 'منتجاتي' }} />
      <Stack.Screen name="products/new" options={{ title: 'إضافة منتج' }} />
      <Stack.Screen name="products/[id]" options={{ title: 'تعديل المنتج' }} />
      <Stack.Screen name="orders/index" options={{ title: 'طلبات المتجر' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'تفاصيل الطلب' }} />
      <Stack.Screen name="earnings" options={{ title: 'الأرباح' }} />
    </Stack>
  );
}
