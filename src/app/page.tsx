import { Box, Container, Heading, Text, SimpleGrid, Button, VStack, HStack } from '@chakra-ui/react';
import Link from 'next/link';

function CategoryIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28px"
      height="28px"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--ses-nav)' }}
    >
      <path d={path} />
    </svg>
  );
}

function IconBadge({ path, bg }: { path: string; bg: string }) {
  return (
    <Box
      w="44px"
      h="44px"
      borderRadius="full"
      bg={bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <CategoryIcon path={path} />
    </Box>
  );
}

export default function HomePage() {
  return (
    <Box minH="100vh">
      {/* Hero Section */}
      <Box bg="var(--ses-nav)" color="var(--ses-nav-ink)" py={{ base: 14, md: 20 }} position="relative" overflow="hidden">
        <Box position="absolute" top="-120px" left="-80px" w="280px" h="280px" bg="rgba(240, 138, 36, 0.2)" borderRadius="full" />
        <Box position="absolute" bottom="-160px" right="-120px" w="320px" h="320px" bg="rgba(255, 255, 255, 0.08)" borderRadius="full" />
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack gap={6} textAlign="center">
            <Heading as="h1" size="2xl">
              سوريا للتسوق الإلكتروني
            </Heading>
            <Text fontSize="xl" maxW="600px">
              السوق السوري الأول للتسوق الإلكتروني - اشترِ وبِع بأمان ودفع نقداً
            </Text>
            <HStack gap={4} flexWrap="wrap" justify="center">
              <Link href="/products">
                <Button size="lg" bg="var(--ses-orange)" color="#1b1b1b" _hover={{ bg: 'var(--ses-orange-dark)' }}>
                  تصفح المنتجات
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" borderColor="white" color="white">
                  كل الفئات
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" borderColor="white" color="white">
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
                تسوق حسب الفئة
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
                  <Box display="flex" justifyContent="center" mb={2}>
                    <CategoryIcon path="M12 3h7v7h-7z M5 14h7v7H5z M5 3h7v7H5z M12 14h7v7h-7z" />
                  </Box>
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
                  <Box display="flex" justifyContent="center" mb={2}>
                    <CategoryIcon path="M7 6l5-3 5 3-2 5H9L7 6z M9 11v8 M15 11v8" />
                  </Box>
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
                  <Box display="flex" justifyContent="center" mb={2}>
                    <CategoryIcon path="M3 11l9-7 9 7 M5 10v10h5v-5h4v5h5V10" />
                  </Box>
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
                  <Box display="flex" justifyContent="center" mb={2}>
                    <CategoryIcon path="M4 7h16v10H4z M8 7v10 M16 7v10" />
                  </Box>
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
            ابحث عن أي شيء
          </Heading>
          <Text color="gray.600" maxW="600px">
            استخدم شريط البحث في الأعلى للبحث عن أي منتج. يمكنك أيضاً استخدام البحث المتقدم للتصفية حسب السعر والحالة والتصنيف
          </Text>
          <HStack gap={4}>
            <Link href="/products">
              <Button size="lg" bg="var(--ses-orange)" color="#1b1b1b" _hover={{ bg: 'var(--ses-orange-dark)' }}>
                ابحث الآن
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
      <Box bg="#fff4e6" py={12}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <HStack gap={2} justify="center">
              <IconBadge path="M12 6a6 6 0 1 1 0 12a6 6 0 0 1 0-12" bg="rgba(240, 138, 36, 0.2)" />
              <Heading as="h2" size="xl" color="var(--ses-nav)">
                SES Live
              </Heading>
            </HStack>
            <Text color="gray.600" maxW="600px">
              عروض بث مباشر من أفضل البائعين - تابع أحدث المنتجات والعروض الحصرية
            </Text>
            <Link href="/ses-live">
              <Button size="lg" bg="var(--ses-orange)" color="#1b1b1b" _hover={{ bg: 'var(--ses-orange-dark)' }}>
                شاهد البث المباشر
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>

      {/* Small Business Section */}
      <Box bg="#f5f7fb" py={12}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <HStack gap={2} justify="center">
              <IconBadge path="M4 7h16v10H4z M7 7v10 M17 7v10" bg="rgba(15, 47, 95, 0.12)" />
              <Heading as="h2" size="xl" color="var(--ses-nav)">
                أعمال صغيرة
              </Heading>
            </HStack>
            <Text color="gray.600" maxW="600px">
              ادعم الأعمال الصغيرة والبائعين الموثقين في سوريا - منتجات مميزة من بائعين معتمدين
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full" maxW="3xl">
              <Box className="neon-card" p={6} textAlign="center" borderRadius="lg">
                <Box display="flex" justifyContent="center" mb={2}>
                  <CategoryIcon path="M5 12l4 4 10-10" />
                </Box>
                <Text fontWeight="bold" fontSize="sm">بائعون موثقون</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center" borderRadius="lg">
                <Box display="flex" justifyContent="center" mb={2}>
                  <CategoryIcon path="M7 12h3l2 2 2-2h3" />
                </Box>
                <Text fontWeight="bold" fontSize="sm">ادعم المحلي</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center" borderRadius="lg">
                <Box display="flex" justifyContent="center" mb={2}>
                  <CategoryIcon path="M12 4l2.5 5 5.5.8-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9 5.5-.8z" />
                </Box>
                <Text fontWeight="bold" fontSize="sm">جودة مضمونة</Text>
              </Box>
            </SimpleGrid>
            <Link href="/small-business">
              <Button size="lg" bg="var(--ses-nav)" color="var(--ses-nav-ink)" _hover={{ bg: '#0b2346' }}>
                تصفح الأعمال الصغيرة
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
                دفع نقدي آمن
              </Heading>
              <Text color="gray.600">
                ادفع عند الاستلام - لا حاجة لبطاقات ائتمان أو تحويلات بنكية
              </Text>
            </Box>
            
            <Box className="neon-card" p={8} borderRadius="lg" textAlign="center">
              <Heading as="h3" size="md" mb={4}>
                حماية المشتري
              </Heading>
              <Text color="gray.600">
                نظام نزاعات عادل يضمن حقوقك في حال وجود أي مشكلة
              </Text>
            </Box>
            
            <Box className="neon-card" p={8} borderRadius="lg" textAlign="center">
              <Heading as="h3" size="md" mb={4}>
                سهولة الاستخدام
              </Heading>
              <Text color="gray.600">
                واجهة عربية بسيطة وسهلة للبيع والشراء
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="#eef2f6" py={16}>
        <Container maxW="container.xl">
          <VStack gap={6} textAlign="center">
            <Heading as="h2" size="xl">
              ابدأ البيع اليوم
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="600px">
              سجل كبائع وابدأ بعرض منتجاتك لآلاف المشترين في سوريا
            </Text>
            <Link href="/auth/register">
              <Button size="lg" bg="var(--ses-orange)" color="#1b1b1b" _hover={{ bg: 'var(--ses-orange-dark)' }}>
                سجل كبائع
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="var(--ses-nav)" color="var(--ses-nav-ink)" py={8}>
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
