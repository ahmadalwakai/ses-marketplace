import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View, TouchableOpacity } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<{ name: string; price?: number; description?: string }>(
          `/api/seller/products/${id}`,
          { authCookie: getAuthCookie() || undefined },
        );
        setValue('name', data?.name || '');
        setValue('price', data?.price != null ? String(data.price) : '');
        setValue('description', data?.description || '');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await apiClient.put(
        `/api/seller/products/${id}`,
        {
          name: values.name,
          price: values.price ? Number(values.price) : undefined,
          description: values.description,
        },
        { authCookie: getAuthCookie() || undefined },
      );
      router.replace('/(seller)/products');
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ headerLeft: () => (<TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}><Text style={{ fontSize: 20, color: colors.text }}>←</Text></TouchableOpacity>) }} />
      <View style={{ gap: spacing.md }}>
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>تعديل المنتج</Text>
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
        <Button title="حفظ التعديل" onPress={handleSubmit(onSubmit)} loading={submitting} />
        <Button title="حذف المنتج" variant="ghost" onPress={() => {
          Alert.alert('تأكيد الحذف', 'هل تريد حذف هذا المنتج نهائيًا؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'حذف', style: 'destructive', onPress: async () => {
              try {
                await apiClient.delete(`/api/seller/products/${id}`, { authCookie: getAuthCookie() || undefined });
                router.replace('/(seller)/products');
              } catch (error) {
                alert((error as Error).message);
              }
            }},
          ]);
        }} />
      </View>
    </Screen>
  );
}
