'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) {
      setError('رمز إعادة التعيين غير صالح');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ غير متوقع');
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="md">
          <VStack gap={8}>
            <Box
              p={8}
              borderWidth={2}
              borderColor="red.500"
              borderRadius="xl"
              bg="red.50"
            >
              <VStack gap={4}>
                <Heading size="lg" color="red.600">
                  رابط غير صالح
                </Heading>
                <Text color="red.600" textAlign="center">
                  رمز إعادة التعيين غير موجود أو غير صالح.
                  يرجى طلب رابط جديد.
                </Text>
                <Link href="/auth/forgot-password">
                  <Button
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                  >
                    طلب رابط جديد
                  </Button>
                </Link>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" py={20}>
      <Container maxW="md">
        <VStack gap={8}>
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="black">
              إعادة تعيين كلمة المرور
            </Heading>
            <Text color="gray.600">
              أدخل كلمة المرور الجديدة
            </Text>
          </VStack>

          <form
            onSubmit={handleSubmit}
            style={{ width: '100%' }}
          >
            <Box
              w="full"
              p={8}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
            <Stack gap={6}>
              {error && (
                <Box
                  p={4}
                  bg="red.50"
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor="red.200"
                >
                  <Text color="red.600" textAlign="center">
                    {error}
                  </Text>
                </Box>
              )}

              {success ? (
                <Box
                  p={4}
                  bg="green.50"
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor="green.200"
                >
                  <VStack gap={2}>
                    <Text color="green.700" textAlign="center" fontWeight="bold">
                      تم تغيير كلمة المرور بنجاح!
                    </Text>
                    <Text color="green.600" textAlign="center" fontSize="sm">
                      جاري تحويلك لصفحة تسجيل الدخول...
                    </Text>
                  </VStack>
                </Box>
              ) : (
                <>
                  <Stack gap={2}>
                    <Text fontWeight="bold" color="black">
                      كلمة المرور الجديدة
                    </Text>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      size="lg"
                      borderWidth={2}
                      borderColor="black"
                      _focus={{ borderColor: 'black', boxShadow: '2px 2px 0 0 black' }}
                      required
                      minLength={8}
                    />
                  </Stack>

                  <Stack gap={2}>
                    <Text fontWeight="bold" color="black">
                      تأكيد كلمة المرور
                    </Text>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور"
                      size="lg"
                      borderWidth={2}
                      borderColor="black"
                      _focus={{ borderColor: 'black', boxShadow: '2px 2px 0 0 black' }}
                      required
                    />
                  </Stack>

                  <Button
                    type="submit"
                    size="lg"
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    disabled={loading}
                    w="full"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                  </Button>
                </>
              )}

              <Link href="/auth/login">
                <Text color="gray.600" textAlign="center" _hover={{ color: 'black', textDecoration: 'underline' }}>
                  ← العودة لتسجيل الدخول
                </Text>
              </Link>
            </Stack>
          </Box>
          </form>

          <Link href="/">
            <Text color="gray.600" _hover={{ color: 'black' }}>
              ← العودة للصفحة الرئيسية
            </Text>
          </Link>
        </VStack>
      </Container>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" bg="white" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="black" />
      </Box>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
