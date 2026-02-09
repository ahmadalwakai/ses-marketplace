import { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { register as apiRegister } from '../../src/lib/api/auth';
import { colors, spacing, typography } from '../../src/theme/tokens';

const schema = z.object({
  name: z.string().min(2, 'الاسم قصير'),
  email: z.string().email('أدخل بريدًا صالحًا'),
  password: z.string().min(6, 'كلمة المرور قصيرة'),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await apiRegister(values);
      router.replace('/(auth)/login');
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      <View style={{ gap: spacing.md }}>
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>إنشاء حساب</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="الاسم الكامل" value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />
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
        <Button title="تسجيل" onPress={handleSubmit(onSubmit)} loading={submitting} />
        <Text style={{ color: colors.text }} onPress={() => router.push('/(auth)/login')}>
          لدي حساب سابق
        </Text>
      </View>
    </Screen>
  );
}
