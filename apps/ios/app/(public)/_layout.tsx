import { Stack } from 'expo-router';
import { colors } from '../../src/theme/tokens';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Stack.Screen name="products/index" options={{ title: 'المنتجات' }} />
      <Stack.Screen name="products/[slug]" options={{ title: 'تفاصيل المنتج' }} />
      <Stack.Screen name="categories/index" options={{ title: 'كل الفئات' }} />
      <Stack.Screen name="categories/[slug]" options={{ title: 'تصنيف' }} />
      <Stack.Screen name="stores/[slug]" options={{ title: 'المتجر' }} />
      <Stack.Screen name="ses-live" options={{ title: 'SES Live' }} />
      <Stack.Screen name="small-business" options={{ title: 'أعمال صغيرة' }} />
    </Stack>
  );
}
