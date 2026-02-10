'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Box, Button, Container, Heading, Text, VStack, Spinner } from '@chakra-ui/react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids') || '';
  const orderIds = ids ? ids.split(',').filter(Boolean) : [];

  return (
    <VStack gap={5} textAlign="center">
      <Heading size="lg" color="black">تم تأكيد طلبك</Heading>
      <Text color="gray.600">شكراً لتسوقك معنا. سيتم التواصل معك لتأكيد الطلب.</Text>
      {orderIds.length > 0 && (
        <VStack gap={2}>
          <Text color="gray.600">أرقام الطلب:</Text>
          {orderIds.map((id) => (
            <Text key={id} fontWeight="bold" color="black">
              #{id.slice(-8)}
            </Text>
          ))}
        </VStack>
      )}
      <Link href="/dashboard">
        <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
          عرض الطلبات
        </Button>
      </Link>
      <Link href="/products">
        <Button variant="outline" borderColor="black" color="black">
          متابعة التسوق
        </Button>
      </Link>
    </VStack>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Box bg="white" minH="100vh" py={12}>
      <Container maxW="lg">
        <Suspense fallback={<VStack py={10}><Spinner size="xl" color="black" /></VStack>}>
          <CheckoutSuccessContent />
        </Suspense>
      </Container>
    </Box>
  );
}
