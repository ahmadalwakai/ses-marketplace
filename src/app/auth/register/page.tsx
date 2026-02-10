'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  HStack,
  Separator,
} from '@chakra-ui/react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب');
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setError('حدث خطأ أثناء التسجيل بـ Google');
      setGoogleLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="white" py={20}>
      <Container maxW="md">
        <VStack gap={8}>
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="black">
              إنشاء حساب
            </Heading>
            <Text color="gray.600">
              انضم إلى سوق سوريا الإلكتروني
            </Text>
          </VStack>

          <Box
            w="full"
            p={8}
            borderWidth={2}
            borderColor="black"
            borderRadius="xl"
            boxShadow="4px 4px 0 0 black"
          >
            <Stack gap={5}>
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

              {/* Google Sign Up Button */}
              <Button
                size="lg"
                variant="outline"
                borderWidth={2}
                borderColor="black"
                bg="white"
                color="black"
                _hover={{ bg: 'gray.50' }}
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                w="full"
              >
                <HStack gap={3}>
                  <GoogleIcon />
                  <Text>{googleLoading ? 'جاري التحميل...' : 'التسجيل بـ Google'}</Text>
                </HStack>
              </Button>

              <HStack gap={4}>
                <Separator flex={1} />
                <Text color="gray.500" fontSize="sm">أو</Text>
                <Separator flex={1} />
              </HStack>

              <form onSubmit={handleSubmit}>
                <Stack gap={4}>
                  <Stack gap={2}>
                    <Text fontWeight="bold" color="black">
                      الاسم الكامل
                    </Text>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أحمد محمد"
                      size="lg"
                      borderWidth={2}
                      borderColor="black"
                      _focus={{ borderColor: 'black', boxShadow: '2px 2px 0 0 black' }}
                      required
                    />
                  </Stack>

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

                  <Stack gap={2}>
                    <Text fontWeight="bold" color="black">
                      رقم الهاتف (اختياري)
                    </Text>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+963 9XX XXX XXX"
                      size="lg"
                      borderWidth={2}
                      borderColor="black"
                      _focus={{ borderColor: 'black', boxShadow: '2px 2px 0 0 black' }}
                    />
                  </Stack>

                  <Stack gap={2}>
                    <Text fontWeight="bold" color="black">
                      كلمة المرور
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
                    disabled={loading || googleLoading}
                    w="full"
                  >
                    {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                  </Button>
                </Stack>
              </form>

              <HStack justify="center" gap={1}>
                <Text color="gray.600">لديك حساب بالفعل؟</Text>
                <Link href="/auth/login">
                  <Text color="black" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    تسجيل الدخول
                  </Text>
                </Link>
              </HStack>
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
