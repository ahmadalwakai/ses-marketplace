import { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

const schema = z.object({
  name: z.string().min(2, 'أدخل اسم المنتج'),
  price: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewProduct() {
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
      await apiClient.post('/api/seller/products', {
        name: values.name,
        price: values.price ? Number(values.price) : undefined,
        description: values.description,
      }, { authCookie: getAuthCookie() || undefined });
      router.replace('/(seller)/products');
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
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>إضافة منتج جديد</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="اسم المنتج" value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />
        <Controller
          control={control}
          name="price"
          render={({ field: { onChange, value } }) => (
            <Input label="السعر" keyboardType="numeric" value={value} onChangeText={onChange} error={errors.price?.message} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input label="الوصف" multiline value={value} onChangeText={onChange} error={errors.description?.message} />
          )}
        />
        <Button title="حفظ المنتج" onPress={handleSubmit(onSubmit)} loading={submitting} />
      </View>
    </Screen>
  );
}
