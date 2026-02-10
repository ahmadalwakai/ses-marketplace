'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Spinner,
} from '@chakra-ui/react';

const roleLabels: Record<string, string> = {
  VISITOR: 'زائر',
  CUSTOMER: 'عميل',
  SELLER: 'بائع',
  ADMIN: 'مدير',
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد التفعيل',
  ACTIVE: 'نشط',
  SUSPENDED: 'موقوف',
  BANNED: 'محظور',
};

const statusColors: Record<string, string> = {
  PENDING: 'yellow',
  ACTIVE: 'green',
  SUSPENDED: 'orange',
  BANNED: 'red',
};

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="lg">
          <VStack py={20}>
            <Spinner size="xl" color="black" />
            <Text color="gray.600">جاري التحميل...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="lg">
          <VStack gap={6} textAlign="center">
            <Text fontSize="6xl">🔒</Text>
            <Heading size="xl" color="black">
              يرجى تسجيل الدخول
            </Heading>
            <Text color="gray.600">
              تحتاج إلى تسجيل الدخول للوصول إلى هذه الصفحة
            </Text>
            <HStack gap={4}>
              <Link href="/auth/login">
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: 'gray.800' }}
                  size="lg"
                >
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  variant="outline"
                  borderColor="black"
                  borderWidth={2}
                  color="black"
                  _hover={{ bg: 'gray.50' }}
                  size="lg"
                >
                  إنشاء حساب
                </Button>
              </Link>
            </HStack>
          </VStack>
        </Container>
      </Box>
    );
  }

  const user = session.user;

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="4xl">
        <VStack gap={8} align="stretch">
          <VStack gap={2} textAlign="center">
            <Text fontSize="4xl">👤</Text>
            <Heading size="2xl" color="black">
              حسابي
            </Heading>
            <Text color="gray.600">
              مرحباً {user.name || 'بك'}
            </Text>
          </VStack>

          {/* User Info Card */}
          <Box
            borderWidth={2}
            borderColor="black"
            borderRadius="xl"
            p={6}
            boxShadow="4px 4px 0 0 black"
          >
            <VStack gap={4} align="stretch">
              <Heading size="md" color="black">
                معلومات الحساب
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    الاسم
                  </Text>
                  <Text fontWeight="bold" color="black">
                    {user.name || 'غير محدد'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    البريد الإلكتروني
                  </Text>
                  <Text fontWeight="bold" color="black">
                    {user.email}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    نوع الحساب
                  </Text>
                  <Badge colorPalette="blue" px={2} py={1}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    حالة الحساب
                  </Text>
                  <Badge colorPalette={statusColors[user.status] || 'gray'} px={2} py={1}>
                    {statusLabels[user.status] || user.status}
                  </Badge>
                </Box>
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Quick Links */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
            <Link href="/dashboard">
              <Box
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                p={4}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0 0 black' }}
              >
                <VStack>
                  <Text fontSize="2xl">📦</Text>
                  <Text fontWeight="bold" color="black">
                    طلباتي
                  </Text>
                </VStack>
              </Box>
            </Link>

            <Link href="/saved">
              <Box
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                p={4}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0 0 black' }}
              >
                <VStack>
                  <Text fontSize="2xl">❤️</Text>
                  <Text fontWeight="bold" color="black">
                    المحفوظات
                  </Text>
                </VStack>
              </Box>
            </Link>

            <Link href="/cart">
              <Box
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                p={4}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0 0 black' }}
              >
                <VStack>
                  <Text fontSize="2xl">🛒</Text>
                  <Text fontWeight="bold" color="black">
                    السلة
                  </Text>
                </VStack>
              </Box>
            </Link>

            {user.role === 'SELLER' && (
              <Link href="/seller/dashboard">
                <Box
                  borderWidth={2}
                  borderColor="black"
                  borderRadius="xl"
                  p={4}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0 0 black' }}
                >
                  <VStack>
                    <Text fontSize="2xl">🏪</Text>
                    <Text fontWeight="bold" color="black">
                      لوحة البائع
                    </Text>
                  </VStack>
                </Box>
              </Link>
            )}

            {user.role === 'ADMIN' && (
              <Link href="/admin/dashboard">
                <Box
                  borderWidth={2}
                  borderColor="black"
                  borderRadius="xl"
                  p={4}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: '4px 4px 0 0 black' }}
                >
                  <VStack>
                    <Text fontSize="2xl">⚙️</Text>
                    <Text fontWeight="bold" color="black">
                      لوحة الإدارة
                    </Text>
                  </VStack>
                </Box>
              </Link>
            )}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}
