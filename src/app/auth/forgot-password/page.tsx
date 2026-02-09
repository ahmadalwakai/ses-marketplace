'use client';

import { useState } from 'react';
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
} from '@chakra-ui/react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ غير متوقع');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="white" py={20}>
      <Container maxW="md">
        <VStack gap={8}>
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="black">
              نسيت كلمة المرور
            </Heading>
            <Text color="gray.600">
              أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور
            </Text>
          </VStack>

          <Box
            as="form"
            onSubmit={handleSubmit}
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
                  <Text color="green.700" textAlign="center">
                    إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.
                    يرجى التحقق من صندوق الوارد.
                  </Text>
                </Box>
              ) : (
                <>
                  <Stack gap={2}>
                    <Text fontWeight="bold" color="black">
                      البريد الإلكتروني
                    </Text>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
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
                    {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
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
