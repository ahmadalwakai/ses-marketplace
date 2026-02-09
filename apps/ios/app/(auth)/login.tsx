import { useState } from 'react';
import { Text, View, Linking, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/lib/store/auth';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { googleAuthUrl } from '../../src/lib/api/auth';

const schema = z.object({
  email: z.string().email('أدخل بريدًا صالحًا'),
  password: z.string().min(6, 'كلمة المرور قصيرة'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      router.replace('/(customer)/dashboard');
    } catch (error) {
      // Surface the error message inline
      alert((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      <View style={{ gap: spacing.md }}>
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>تسجيل الدخول</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input label="البريد الإلكتروني" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input label="كلمة المرور" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
          )}
        />
        <Button title="دخول" onPress={handleSubmit(onSubmit)} loading={submitting} />
        <Button title="الدخول بحساب جوجل" variant="outline" onPress={async () => {
          try {
            const supported = await Linking.canOpenURL(googleAuthUrl);
            if (supported) await Linking.openURL(googleAuthUrl);
            else alert('لا يمكن فتح رابط تسجيل الدخول بجوجل');
          } catch { alert('لا يمكن فتح رابط تسجيل الدخول بجوجل'); }
        }} />
        <Text style={{ color: colors.text }} onPress={() => router.push('/(auth)/forgot-password')}>
          نسيت كلمة المرور؟
        </Text>
        <Text style={{ color: colors.text }} onPress={() => router.push('/(auth)/register')}>
          مستخدم جديد؟ أنشئ حساب
        </Text>
      </View>
    </Screen>
  );
}
