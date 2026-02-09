import { Stack } from 'expo-router';
import { colors } from '../../src/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'تسجيل الدخول' }} />
      <Stack.Screen name="register" options={{ title: 'إنشاء حساب' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'نسيت كلمة المرور' }} />
    </Stack>
  );
}
