import { Stack } from 'expo-router';
import { colors } from '../../src/theme/tokens';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'لوحة العميل' }} />
      <Stack.Screen name="orders/index" options={{ title: 'طلباتي' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'تفاصيل الطلب' }} />
      <Stack.Screen name="wishlist" options={{ title: 'قائمة المفضلة' }} />
      <Stack.Screen name="saved" options={{ title: 'المحفوظات' }} />
      <Stack.Screen name="compare" options={{ title: 'المقارنة' }} />
      <Stack.Screen name="disputes/index" options={{ title: 'الشكاوى' }} />
      <Stack.Screen name="disputes/[id]" options={{ title: 'تفاصيل الشكوى' }} />
    </Stack>
  );
}
