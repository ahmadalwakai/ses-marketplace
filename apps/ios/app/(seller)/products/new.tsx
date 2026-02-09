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
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; description: string; tags: string[] } | null>(null);
  const [aiError, setAiError] = useState('');

  const handleAiOptimize = async () => {
    const values = getValues();
    if (!values.name) { setAiError('أدخل اسم المنتج أولاً'); return; }
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const { data } = await apiClient.post<any>('/api/ai/seller/optimize-listing', {
        title: values.name,
        description: values.description || values.name,
      }, { authCookie: getAuthCookie() || undefined });
      if (data?.ok && data?.data) {
        setAiResult(data.data);
      } else {
        setAiError(data?.error?.message || 'حدث خطأ');
      }
    } catch (err) {
      setAiError((err as Error).message || 'فشل الاتصال');
    } finally {
      setAiLoading(false);
    }
  };

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
        {/* AI Optimization */}
        <TouchableOpacity
          style={{ backgroundColor: '#7c3aed', borderRadius: 12, padding: 14, alignItems: 'center', opacity: aiLoading ? 0.6 : 1 }}
          onPress={handleAiOptimize}
          disabled={aiLoading}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {aiLoading ? 'جاري التحسين...' : '🤖 تحسين الإعلان بالذكاء الاصطناعي'}
          </Text>
        </TouchableOpacity>
        {aiError ? <Text style={{ color: '#ef4444', fontSize: 13 }}>{aiError}</Text> : null}
        {aiResult && (
          <View style={{ backgroundColor: '#f5f3ff', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#c4b5fd' }}>
            <Text style={{ fontWeight: '700', color: '#6d28d9', fontSize: 15 }}>نتائج التحسين:</Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>العنوان: {aiResult.title}</Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>الوصف: {aiResult.description}</Text>
            {aiResult.tags.length > 0 && (
              <Text style={{ color: '#6d28d9', fontSize: 13 }}>كلمات: {aiResult.tags.join('، ')}</Text>
            )}
            <TouchableOpacity
              style={{ backgroundColor: '#6d28d9', borderRadius: 8, padding: 10, alignItems: 'center' }}
              onPress={() => {
                setValue('name', aiResult!.title);
                setValue('description', aiResult!.description);
                setAiResult(null);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>✅ تطبيق التحسينات</Text>
            </TouchableOpacity>
          </View>
        )}
        <Button title="حفظ المنتج" onPress={handleSubmit(onSubmit)} loading={submitting} />
      </View>
    </Screen>
  );
}
