import { Box, Container, Heading, Text, VStack, SimpleGrid } from '@chakra-ui/react';

export default function BuyerProtectionPage() {
  return (
    <Box bg="white" minH="100vh" py={12}>
      <Container maxW="6xl">
        <VStack align="stretch" gap={8}>
          <VStack align="start" gap={2}>
            <Heading size="xl" color="black">حماية المشتري</Heading>
            <Text color="gray.600">نحمي مشترياتك بخطوات واضحة وشفافة من أول الطلب حتى الاستلام.</Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>الدفع عند الاستلام</Heading>
              <Text color="gray.600">ادفع فقط عند استلام المنتج والتأكد من حالته.</Text>
            </Box>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>تتبع الطلبات</Heading>
              <Text color="gray.600">يمكنك متابعة حالة طلبك خطوة بخطوة من لوحة التحكم.</Text>
            </Box>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>مراجعات موثوقة</Heading>
              <Text color="gray.600">نقبل التقييمات فقط بعد تسليم الطلب لضمان المصداقية.</Text>
            </Box>
            <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <Heading size="md" color="black" mb={3}>حل النزاعات</Heading>
              <Text color="gray.600">فريق الدعم جاهز لمساعدتك في حال وجود أي مشكلة مع الطلب.</Text>
            </Box>
          </SimpleGrid>

          <Box borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
            <Heading size="md" color="black" mb={3}>ما الذي يغطيه البرنامج؟</Heading>
            <VStack align="start" gap={2}>
              <Text color="gray.600">- المنتج وصل بحالة تالفة أو غير مطابق للوصف.</Text>
              <Text color="gray.600">- المنتج لم يصل خلال الفترة المحددة.</Text>
              <Text color="gray.600">- البائع لم يستجب بعد إتمام الطلب.</Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
