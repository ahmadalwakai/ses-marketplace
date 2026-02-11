'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { useAppToast } from '@/components/Toast';

export default function WalletRedeemPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useAppToast();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState('USD');
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/wallet/redeem');
    }
  }, [sessionStatus, router]);

  // Fetch wallet balance
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    async function fetchBalance() {
      try {
        const res = await fetch('/api/vouchers/wallet');
        const data = await res.json();
        if (res.ok && data.ok) {
          setWalletBalance(data.data.walletBalance);
          setWalletCurrency(data.data.walletCurrency);
        }
      } catch {
        // Silent fail, balance will show as loading
      } finally {
        setLoadingBalance(false);
      }
    }

    fetchBalance();
  }, [sessionStatus]);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 8) {
      toast.error('كود القسيمة يجب أن يكون 8 أحرف على الأقل');
      return;
    }
    if (trimmed.length > 64) {
      toast.error('كود القسيمة طويل جداً');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const msg = data.error?.message ?? 'فشل في استرداد القسيمة';
        const codeStr = data.error?.code ?? '';

        if (codeStr === 'RATE_LIMITED') {
          toast.error(msg);
        } else if (codeStr === 'INVALID_CODE') {
          toast.error('كود القسيمة غير صالح');
        } else if (codeStr === 'VOUCHER_USED') {
          toast.error('هذه القسيمة تم استخدامها بالفعل');
        } else if (codeStr === 'VOUCHER_DISABLED') {
          toast.error('هذه القسيمة معطلة');
        } else if (codeStr === 'VOUCHER_EXPIRED') {
          toast.error('هذه القسيمة منتهية الصلاحية');
        } else {
          toast.error(msg);
        }
        return;
      }

      const result = data.data;
      setWalletBalance(result.walletBalance);
      setWalletCurrency(result.walletCurrency);
      setCode('');
      toast.success(
        `تم إضافة ${result.creditedAmount} ${result.currency} إلى محفظتك!`,
        `الرصيد الجديد: ${result.walletBalance} ${result.walletCurrency}`
      );
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <Container maxW="container.sm" py={20}>
        <HStack justifyContent="center">
          <Spinner size="lg" />
        </HStack>
      </Container>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Container maxW="container.sm" py={8}>
      <VStack gap={6} align="stretch">
        <Heading size="lg" textAlign="center">
          💰 المحفظة
        </Heading>

        {/* Balance Card */}
        <Box
          bg="white"
          borderWidth={2}
          borderColor="black"
          borderRadius="xl"
          boxShadow="4px 4px 0 0 black"
          p={6}
          textAlign="center"
        >
          <Text fontSize="sm" color="gray.500" mb={1}>
            رصيد المحفظة
          </Text>
          {loadingBalance ? (
            <Spinner size="md" />
          ) : (
            <Heading size="2xl" color="green.600">
              {walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}{' '}
              <Text as="span" fontSize="lg" color="gray.500">
                {walletCurrency}
              </Text>
            </Heading>
          )}
        </Box>

        {/* Redeem Card */}
        <Box
          bg="white"
          borderWidth={2}
          borderColor="black"
          borderRadius="xl"
          boxShadow="4px 4px 0 0 black"
          p={6}
        >
          <VStack gap={4} align="stretch">
            <Heading size="md">🎁 استرداد قسيمة</Heading>
            <Text fontSize="sm" color="gray.600">
              أدخل كود القسيمة لإضافة الرصيد إلى محفظتك
            </Text>

            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="أدخل كود القسيمة..."
              size="lg"
              fontFamily="mono"
              textAlign="center"
              letterSpacing="wider"
              maxLength={64}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) handleRedeem();
              }}
            />

            <Button
              colorPalette="green"
              size="lg"
              onClick={handleRedeem}
              disabled={loading || code.trim().length < 8}
            >
              {loading ? <Spinner size="sm" /> : 'استرداد القسيمة'}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
