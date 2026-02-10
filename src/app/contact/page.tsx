import { Box, Container, Heading, Text, VStack, HStack, Button, Input, Textarea } from '@chakra-ui/react';

export default function ContactPage() {
  return (
    <Box bg="white" minH="100vh" py={12}>
      <Container maxW="5xl">
        <VStack align="stretch" gap={8}>
          <VStack align="start" gap={2}>
            <Heading size="xl" color="black">تواصل معنا</Heading>
            <Text color="gray.600">فريق الدعم جاهز للرد على استفساراتك.</Text>
          </VStack>

          <HStack align="start" gap={8} flexDir={{ base: 'column', md: 'row' }}>
            <VStack align="stretch" gap={4} flex={1}>
              <Input placeholder="الاسم الكامل" borderWidth={2} borderColor="black" />
              <Input placeholder="البريد الإلكتروني" type="email" borderWidth={2} borderColor="black" />
              <Input placeholder="رقم الهاتف" borderWidth={2} borderColor="black" />
              <Textarea placeholder="كيف يمكننا مساعدتك؟" borderWidth={2} borderColor="black" rows={6} />
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                إرسال الرسالة
              </Button>
            </VStack>

            <Box flex={1} borderWidth={2} borderColor="black" borderRadius="xl" p={6}>
              <VStack align="start" gap={4}>
                <Heading size="md" color="black">قنوات الدعم</Heading>
                <Text color="gray.600">📞 الهاتف: 011-000-0000</Text>
                <Text color="gray.600">✉️ البريد الإلكتروني: support@ses.sy</Text>
                <Text color="gray.600">🕒 ساعات العمل: يومياً 9 ص - 9 م</Text>
                <Text color="gray.600">📍 دمشق - سوريا</Text>
              </VStack>
            </Box>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
