'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  Alert,
  Badge,
} from '@chakra-ui/react';
import { useCartStore } from '@/lib/store';

const steps = ['السلة', 'المعلومات', 'العنوان', 'الدفع'];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState('');

  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const isGuest = status !== 'authenticated';

  const total = useMemo(() => getTotal(), [getTotal]);
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';

  const canGoNext = () => {
    if (step === 0) return items.length > 0;
    if (step === 1) {
      if (isGuest && (!name.trim() || !email.trim())) return false;
      return phone.trim().length >= 5;
    }
    if (step === 2) return governorate.trim() && city.trim() && street.trim();
    return true;
  };

  const handleNext = () => {
    setError('');
    if (!canGoNext()) {
      setError('يرجى تعبئة الحقول المطلوبة قبل المتابعة');
      return;
    }
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError('');
    if (!canGoNext()) {
      setError('يرجى تعبئة الحقول المطلوبة قبل إتمام الطلب');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map((item) => ({ productId: item.productId, qty: item.quantity })),
        deliveryMode: 'ARRANGED',
        deliveryAddress: {
          street,
          city,
          governorate,
          postalCode: postalCode || undefined,
          notes: addressNotes || undefined,
        },
        phone,
        notes: orderNotes || undefined,
      };

      const url = isGuest ? '/api/orders/guest' : '/api/orders/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGuest
            ? { ...payload, email: email.trim(), name: name.trim() || undefined }
            : payload
        ),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message || 'تعذر إنشاء الطلب');
        setLoading(false);
        return;
      }

      clearCart();
      const ids = (data.data?.orders || []).map((o: any) => o.id).join(',');
      router.push(`/checkout/success?ids=${encodeURIComponent(ids)}`);
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Box bg="white" minH="100vh" py={10}>
        <Container maxW="lg">
          <VStack gap={6} textAlign="center">
            <Heading size="lg" color="black">السلة فارغة</Heading>
            <Text color="gray.600">أضف منتجات إلى السلة ثم تابع عملية الشراء</Text>
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                تصفح المنتجات
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh" py={8}>
      <Container maxW="6xl">
        <VStack align="stretch" gap={6}>
          <VStack align="start" gap={1}>
            <Heading size="lg" color="black">إتمام الشراء</Heading>
            <Text color="gray.600">أكمل الخطوات لإرسال الطلب والدفع عند الاستلام</Text>
          </VStack>

          <HStack gap={3} flexWrap="wrap">
            {steps.map((label, index) => (
              <HStack key={label} gap={2}>
                <Badge
                  colorScheme={index <= step ? 'green' : 'gray'}
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {index + 1}
                </Badge>
                <Text color={index <= step ? 'black' : 'gray.500'}>{label}</Text>
              </HStack>
            ))}
          </HStack>

          {error && (
            <Alert.Root status="error" borderRadius="md">
              <Alert.Indicator />
              <Alert.Title>{error}</Alert.Title>
            </Alert.Root>
          )}

          {step === 0 && (
            <VStack align="stretch" gap={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {items.map((item) => (
                  <Box key={item.productId} borderWidth={1} borderRadius="md" p={4}>
                    <Text fontWeight="bold" color="black">{item.title}</Text>
                    <Text color="gray.600" fontSize="sm">
                      الكمية: {item.quantity}
                    </Text>
                    <Text color="gray.600" fontSize="sm">
                      السعر: {formatPrice(item.price * item.quantity)}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              <HStack justify="space-between">
                <Text color="gray.600">المجموع</Text>
                <Text fontWeight="bold" color="black">{formatPrice(total)}</Text>
              </HStack>
            </VStack>
          )}

          {step === 1 && (
            <VStack align="stretch" gap={4}>
              {isGuest ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Input
                    placeholder="الاسم الكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder="البريد الإلكتروني"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </SimpleGrid>
              ) : (
                <Box borderWidth={1} borderRadius="md" p={4}>
                  <Text fontWeight="bold" color="black">بيانات الحساب</Text>
                  <Text color="gray.600">{session?.user?.name}</Text>
                  <Text color="gray.600">{session?.user?.email}</Text>
                </Box>
              )}
              <Input
                placeholder="رقم الهاتف"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {isGuest && (
                <Text color="gray.500" fontSize="sm">
                  لديك حساب؟ يمكنك تسجيل الدخول لإدارة الطلبات.
                </Text>
              )}
            </VStack>
          )}

          {step === 2 && (
            <VStack align="stretch" gap={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Input
                  placeholder="المحافظة"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                />
                <Input
                  placeholder="المدينة"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  placeholder="الشارع"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
                <Input
                  placeholder="الرمز البريدي (اختياري)"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </SimpleGrid>
              <Textarea
                placeholder="ملاحظات العنوان (اختياري)"
                value={addressNotes}
                onChange={(e) => setAddressNotes(e.target.value)}
              />
            </VStack>
          )}

          {step === 3 && (
            <VStack align="stretch" gap={4}>
              <Box borderWidth={1} borderRadius="md" p={4}>
                <Text fontWeight="bold" color="black">طريقة الدفع</Text>
                <Text color="gray.600">الدفع عند الاستلام (COD)</Text>
              </Box>
              <Textarea
                placeholder="ملاحظات الطلب (اختياري)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
              <Box borderWidth={1} borderRadius="md" p={4}>
                <Text fontWeight="bold" color="black">مراجعة الطلب</Text>
                {items.map((item) => (
                  <HStack key={item.productId} justify="space-between" mt={2}>
                    <Text color="gray.600">{item.title} × {item.quantity}</Text>
                    <Text color="black">{formatPrice(item.price * item.quantity)}</Text>
                  </HStack>
                ))}
                <HStack justify="space-between" mt={3}>
                  <Text fontWeight="bold" color="black">الإجمالي</Text>
                  <Text fontWeight="bold" color="black">{formatPrice(total)}</Text>
                </HStack>
              </Box>
            </VStack>
          )}

          <HStack justify="space-between" pt={2}>
            <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
              رجوع
            </Button>
            {step < steps.length - 1 ? (
              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                متابعة
              </Button>
            ) : (
              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                onClick={handleSubmit}
                loading={loading}
                loadingText="جاري إنشاء الطلب"
              >
                تأكيد الطلب
              </Button>
            )}
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
