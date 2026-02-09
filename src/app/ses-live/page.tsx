'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Badge,
} from '@chakra-ui/react';

export default function SESLivePage() {
  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="4xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <HStack justify="center" gap={3}>
            <Text fontSize="3xl">🔴</Text>
            <Heading size="2xl" color="black">
              SES Live
            </Heading>
            <Badge colorPalette="red" fontSize="md" p={2} borderRadius="full">
              قريباً
            </Badge>
          </HStack>

          {/* Hero */}
          <Box
            className="neon-card"
            p={10}
            textAlign="center"
          >
            <VStack gap={4}>
              <Text fontSize="6xl">📺</Text>
              <Heading size="lg" color="black">
                البث المباشر قادم قريباً!
              </Heading>
              <Text color="gray.600" fontSize="lg" maxW="lg" mx="auto">
                سيتمكن البائعون من عرض منتجاتهم عبر بث مباشر مع إمكانية التفاعل
                والشراء المباشر. تابعنا لتكون أول من يعرف!
              </Text>
            </VStack>
          </Box>

          {/* Features */}
          <Box className="neon-card" p={8}>
            <VStack gap={4} align="stretch">
              <Heading size="md" color="black">
                ✨ مميزات قادمة
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {[
                  { icon: '🎥', title: 'بث مباشر من البائعين', desc: 'شاهد المنتجات مباشرة قبل الشراء' },
                  { icon: '💬', title: 'تفاعل في الوقت الحقيقي', desc: 'اسأل البائع واحصل على إجابة فورية' },
                  { icon: '🛒', title: 'شراء مباشر أثناء البث', desc: 'اشترِ المنتج مباشرة دون مغادرة البث' },
                  { icon: '🏷️', title: 'عروض حصرية للمشاهدين', desc: 'خصومات خاصة أثناء البث المباشر' },
                  { icon: '🔔', title: 'إشعارات عند بدء البث', desc: 'لا تفوت أي بث من متاجرك المفضلة' },
                  { icon: '⭐', title: 'تقييم البث', desc: 'قيّم تجربة البث وساعد الآخرين' },
                ].map((feature) => (
                  <HStack
                    key={feature.title}
                    p={4}
                    bg="gray.50"
                    borderRadius="lg"
                    gap={3}
                    align="start"
                  >
                    <Text fontSize="2xl">{feature.icon}</Text>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" color="black">
                        {feature.title}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {feature.desc}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* CTA */}
          <HStack justify="center" gap={4} flexWrap="wrap">
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                تصفح المنتجات
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" borderColor="black" color="black" size="lg">
                العودة للرئيسية
              </Button>
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
