import { Box, Container, Heading, Text, VStack, SimpleGrid } from '@chakra-ui/react';

export default function ReturnsPage() {
  return (
    <Box bg="white" minH="100vh" py={12}>
      <Container maxW="6xl">
        <VStack align="stretch" gap={8}>
          <VStack align="start" gap={2}>
            <Heading size="xl" color="black">سياسة الاسترجاع</Heading>
            <Text color="gray.600">هدفنا أن تكون تجربة التسوق آمنة وواضحة للجميع.</Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>المدة</Heading>
              <Text color="gray.600">يمكنك طلب الاسترجاع خلال 3 أيام من تاريخ الاستلام.</Text>
            </Box>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>الحالة</Heading>
              <Text color="gray.600">يشترط أن يكون المنتج بحالته الأصلية وبكامل الملحقات.</Text>
            </Box>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>المنتجات المستثناة</Heading>
              <Text color="gray.600">المنتجات الشخصية أو المستخدمة بشكل واضح لا يشملها الاسترجاع.</Text>
            </Box>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>آلية الاسترجاع</Heading>
              <Text color="gray.600">تواصل مع الدعم، وسنقوم بتنظيم عملية الاستلام وإغلاق الطلب.</Text>
            </Box>
          </SimpleGrid>

          <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
            <Heading size="md" color="black" mb={3}>خطوات سريعة</Heading>
            <VStack align="start" gap={2}>
              <Text color="gray.600">1. افتح صفحة الطلب من لوحة التحكم.</Text>
              <Text color="gray.600">2. اضغط على طلب استرجاع.</Text>
              <Text color="gray.600">3. سيقوم فريق الدعم بالتواصل خلال 24 ساعة.</Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
