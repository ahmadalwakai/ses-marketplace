import { Box, Container, Heading, Text, SimpleGrid, Button, VStack, HStack } from '@chakra-ui/react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Box minH="100vh">
      {/* Hero Section */}
      <Box bg="black" color="white" py={20}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <Heading as="h1" size="2xl">
              سوريا للتسوق الإلكتروني
            </Heading>
            <Text fontSize="xl" maxW="600px">
              السوق السوري الأول للتسوق الإلكتروني - اشترِ وبِع بأمان ودفع نقداً
            </Text>
            <HStack gap={4} flexWrap="wrap" justify="center">
              <Link href="/products">
                <Button size="lg" colorScheme="whiteAlpha">
                  تصفح المنتجات
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" colorScheme="whiteAlpha">
                  كل الفئات
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" colorScheme="whiteAlpha">
                  سجل الآن
                </Button>
              </Link>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Shop by Category Section */}
      <Box bg="gray.50" py={12}>
        <Container maxW="container.xl">
          <VStack gap={8}>
            <VStack gap={2} textAlign="center">
              <Heading as="h2" size="xl">
                📂 تسوق حسب الفئة
              </Heading>
              <Text color="gray.600">
                اختر الفئة المناسبة وابدأ التسوق
              </Text>
            </VStack>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} w="full">
              <Link href="/categories">
                <Box
                  className="neon-card"
                  p={6}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)' }}
                >
                  <Text fontSize="3xl" mb={2}>📱</Text>
                  <Text fontWeight="bold">الإلكترونيات</Text>
                </Box>
              </Link>
              <Link href="/categories">
                <Box
                  className="neon-card"
                  p={6}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)' }}
                >
                  <Text fontSize="3xl" mb={2}>👕</Text>
                  <Text fontWeight="bold">الملابس</Text>
                </Box>
              </Link>
              <Link href="/categories">
                <Box
                  className="neon-card"
                  p={6}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)' }}
                >
                  <Text fontSize="3xl" mb={2}>🏠</Text>
                  <Text fontWeight="bold">المنزل والحديقة</Text>
                </Box>
              </Link>
              <Link href="/categories">
                <Box
                  className="neon-card"
                  p={6}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)' }}
                >
                  <Text fontSize="3xl" mb={2}>📦</Text>
                  <Text fontWeight="bold">كل الفئات</Text>
                </Box>
              </Link>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Search Spotlight */}
      <Container maxW="container.xl" py={12}>
        <VStack gap={6} textAlign="center">
          <Heading as="h2" size="xl">
            🔍 ابحث عن أي شيء
          </Heading>
          <Text color="gray.600" maxW="600px">
            استخدم شريط البحث في الأعلى للبحث عن أي منتج. يمكنك أيضاً استخدام البحث المتقدم للتصفية حسب السعر والحالة والتصنيف
          </Text>
          <HStack gap={4}>
            <Link href="/products">
              <Button size="lg" bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                🔍 ابحث الآن
              </Button>
            </Link>
            <Link href="/products?advanced=true">
              <Button size="lg" variant="outline" borderColor="black">
                بحث متقدم
              </Button>
            </Link>
          </HStack>
        </VStack>
      </Container>

      {/* SES Live Section */}
      <Box bg="red.50" py={12}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <HStack gap={2} justify="center">
              <Text fontSize="2xl">🔴</Text>
              <Heading as="h2" size="xl" color="red.600">
                SES Live
              </Heading>
            </HStack>
            <Text color="gray.600" maxW="600px">
              عروض بث مباشر من أفضل البائعين - تابع أحدث المنتجات والعروض الحصرية
            </Text>
            <Link href="/ses-live">
              <Button size="lg" bg="red.500" color="white" _hover={{ bg: 'red.600' }}>
                🔴 شاهد البث المباشر
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>

      {/* Small Business Section */}
      <Box bg="green.50" py={12}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <HStack gap={2} justify="center">
              <Text fontSize="2xl">🏪</Text>
              <Heading as="h2" size="xl" color="green.600">
                أعمال صغيرة
              </Heading>
            </HStack>
            <Text color="gray.600" maxW="600px">
              ادعم الأعمال الصغيرة والبائعين الموثقين في سوريا - منتجات مميزة من بائعين معتمدين
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full" maxW="3xl">
              <Box className="neon-card" p={6} textAlign="center" borderRadius="lg">
                <Text fontSize="2xl" mb={2}>✅</Text>
                <Text fontWeight="bold" fontSize="sm">بائعون موثقون</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center" borderRadius="lg">
                <Text fontSize="2xl" mb={2}>🤝</Text>
                <Text fontWeight="bold" fontSize="sm">ادعم المحلي</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center" borderRadius="lg">
                <Text fontSize="2xl" mb={2}>⭐</Text>
                <Text fontWeight="bold" fontSize="sm">جودة مضمونة</Text>
              </Box>
            </SimpleGrid>
            <Link href="/small-business">
              <Button size="lg" bg="green.600" color="white" _hover={{ bg: 'green.700' }}>
                🏪 تصفح الأعمال الصغيرة
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={16}>
        <VStack gap={12}>
          <Heading as="h2" size="xl" textAlign="center">
            لماذا سوريا للتسوق الإلكتروني؟
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} w="full">
            <Box className="neon-card" p={8} borderRadius="lg" textAlign="center">
              <Heading as="h3" size="md" mb={4}>
                💰 دفع نقدي آمن
              </Heading>
              <Text color="gray.600">
                ادفع عند الاستلام - لا حاجة لبطاقات ائتمان أو تحويلات بنكية
              </Text>
            </Box>
            
            <Box className="neon-card" p={8} borderRadius="lg" textAlign="center">
              <Heading as="h3" size="md" mb={4}>
                🛡️ حماية المشتري
              </Heading>
              <Text color="gray.600">
                نظام نزاعات عادل يضمن حقوقك في حال وجود أي مشكلة
              </Text>
            </Box>
            
            <Box className="neon-card" p={8} borderRadius="lg" textAlign="center">
              <Heading as="h3" size="md" mb={4}>
                🚀 سهولة الاستخدام
              </Heading>
              <Text color="gray.600">
                واجهة عربية بسيطة وسهلة للبيع والشراء
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="gray.100" py={16}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <Heading as="h2" size="xl">
              ابدأ البيع اليوم
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="600px">
              سجل كبائع وابدأ بعرض منتجاتك لآلاف المشترين في سوريا
            </Text>
            <Link href="/auth/register">
              <Button size="lg" bg="black" color="white">
                سجل كبائع
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="black" color="white" py={8}>
        <Container maxW="container.xl">
          <VStack gap={4}>
            <Text textAlign="center">
              © 2026 سوريا للتسوق الإلكتروني - جميع الحقوق محفوظة
            </Text>
            <HStack gap={4}>
              <Link href="/about">عن الموقع</Link>
              <Link href="/contact">تواصل معنا</Link>
              <Link href="/terms">الشروط والأحكام</Link>
              <Link href="/privacy">سياسة الخصوصية</Link>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
