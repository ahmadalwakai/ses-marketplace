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
            <HStack gap={4}>
              <Link href="/products">
                <Button size="lg" colorScheme="whiteAlpha">
                  تصفح المنتجات
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
