import { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { sendResetEmail } from '../../src/lib/api/auth';
import { colors, spacing, typography } from '../../src/theme/tokens';

const schema = z.object({ email: z.string().email('أدخل بريدًا صالحًا') });

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await sendResetEmail(values.email);
      setSent(true);
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
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>استعادة كلمة المرور</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input label="البريد الإلكتروني" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
          )}
        />
        <Button title="إرسال رابط الاستعادة" onPress={handleSubmit(onSubmit)} loading={submitting} />
        {sent && <Text style={{ color: colors.text }}>تم إرسال الرابط إلى بريدك.</Text>}
        <Text style={{ color: colors.text, textDecorationLine: 'underline' }} onPress={() => router.push('/(auth)/login')}>
          العودة لتسجيل الدخول
        </Text>
      </View>
    </Screen>
  );
}
