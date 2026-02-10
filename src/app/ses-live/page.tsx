'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Spinner,
} from '@chakra-ui/react';
import { useSavedStore, useCartStore } from '@/lib/store';

interface Product {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  price: number;
  currency: string;
  condition: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  images: { url: string; alt?: string }[];
  seller: { storeName: string; slug: string };
  category: { name: string; nameAr?: string; slug: string } | null;
}

interface LiveStreamProduct {
  id: string;
  title: string;
  price: number;
  specialPrice: number | null;
  discount: number | null;
  image: string | null;
  slug: string;
  category?: { name: string; nameAr?: string; slug: string } | null;
}

interface LiveStream {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  thumbnail?: string;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  viewerCount: number;
  peakViewers: number;
  seller: {
    storeName: string;
    slug: string;
    ratingAvg: number;
    image?: string;
    name?: string;
  };
  products: LiveStreamProduct[];
}

const conditionLabels: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'رديء',
};

type TabKey = 'live' | 'trending' | 'newest' | 'top-rated';

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

function formatScheduledDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);

  if (diffHrs < 0) return 'قريباً';
  if (diffHrs === 0) return `خلال ${diffMins} دقيقة`;
  if (diffHrs < 24) return `خلال ${diffHrs} ساعة`;
  return date.toLocaleDateString('ar-SY', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
}

export default function SESLivePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('live');
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const savedStore = useSavedStore();
  const cartStore = useCartStore();

  // Fetch live streams
  const fetchStreams = useCallback(async () => {
    setStreamsLoading(true);
    try {
      const res = await fetch('/api/live-streams');
      const data = await res.json();
      if (data.ok) {
        setStreams(data.data || []);
        // Auto-select first LIVE stream
        const liveStream = (data.data || []).find((s: LiveStream) => s.status === 'LIVE');
        if (liveStream) setSelectedStream(liveStream);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setStreamsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sortMap: Record<string, string> = {
        trending: 'relevance',
        newest: 'newest',
        'top-rated': 'rating',
      };
      const sort = sortMap[tab] || 'relevance';
      const res = await fetch(`/api/products?sort=${sort}&limit=12`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  useEffect(() => {
    if (tab !== 'live') {
      fetchProducts();
    }
  }, [tab, fetchProducts]);

  // Refresh viewer counts every 30s for live streams
  useEffect(() => {
    if (tab === 'live') {
      const interval = setInterval(fetchStreams, 30000);
      return () => clearInterval(interval);
    }
  }, [tab, fetchStreams]);

  const liveStreams = streams.filter((s) => s.status === 'LIVE');
  const scheduledStreams = streams.filter((s) => s.status === 'SCHEDULED');
  const endedStreams = streams.filter((s) => s.status === 'ENDED');

  const tabs: { key: TabKey; label: string; icon: string; badge?: number }[] = [
    { key: 'live', label: 'بث مباشر', icon: '📺', badge: liveStreams.length },
    { key: 'trending', label: 'الأكثر رواجاً', icon: '🔥' },
    { key: 'newest', label: 'وصل حديثاً', icon: '✨' },
    { key: 'top-rated', label: 'الأعلى تقييماً', icon: '⭐' },
  ];

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <HStack justify="center" gap={3}>
              <Text fontSize="3xl">📺</Text>
              <Heading size="2xl" color="black">
                SES Live
              </Heading>
              {liveStreams.length > 0 && (
                <Badge
                  colorPalette="red"
                  fontSize="sm"
                  p={1}
                  px={2}
                  borderRadius="full"
                  animation="pulse 2s infinite"
                >
                  🔴 مباشر
                </Badge>
              )}
            </HStack>
            <Text color="gray.600" fontSize="lg">
              عروض مباشرة من البائعين - تابع أحدث البثوث المباشرة والعروض الحصرية
            </Text>
          </VStack>

          {/* Tabs */}
          <HStack justify="center" gap={2} flexWrap="wrap">
            {tabs.map((t) => (
              <Button
                key={t.key}
                size="md"
                bg={tab === t.key ? (t.key === 'live' ? 'red.500' : 'black') : 'white'}
                color={tab === t.key ? 'white' : 'black'}
                borderWidth={2}
                borderColor={t.key === 'live' ? 'red.500' : 'black'}
                _hover={{ bg: tab === t.key ? (t.key === 'live' ? 'red.600' : 'gray.800') : 'gray.100' }}
                onClick={() => setTab(t.key)}
                position="relative"
              >
                {t.icon} {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <Badge
                    colorPalette="red"
                    fontSize="xs"
                    borderRadius="full"
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    minW="20px"
                    h="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {t.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </HStack>

          {/* Live Tab Content */}
          {tab === 'live' && (
            <VStack gap={8} align="stretch">
              {streamsLoading ? (
                <VStack py={16}>
                  <Spinner size="xl" color="red.500" />
                  <Text color="gray.500">جاري تحميل البث المباشر...</Text>
                </VStack>
              ) : (
                <>
                  {/* Active Live Streams */}
                  {liveStreams.length > 0 && (
                    <VStack gap={4} align="stretch">
                      <HStack gap={2}>
                        <Box
                          w="12px"
                          h="12px"
                          bg="red.500"
                          borderRadius="full"
                          animation="pulse 1.5s infinite"
                        />
                        <Heading size="lg" color="black">
                          بث مباشر الآن ({liveStreams.length})
                        </Heading>
                      </HStack>

                      {/* Featured Live Stream */}
                      {selectedStream && selectedStream.status === 'LIVE' && (
                        <Box
                          borderWidth={3}
                          borderColor="red.400"
                          borderRadius="2xl"
                          overflow="hidden"
                          bg="gray.900"
                          position="relative"
                        >
                          {/* Stream Player Area */}
                          <Box
                            h={{ base: '250px', md: '400px' }}
                            bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                            position="relative"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {selectedStream.thumbnail ? (
                              <Image
                                src={selectedStream.thumbnail}
                                alt={selectedStream.titleAr || selectedStream.title}
                                fill
                                style={{ objectFit: 'cover', opacity: 0.4 }}
                                unoptimized
                              />
                            ) : null}

                            {/* Overlay content */}
                            <VStack position="relative" zIndex={2} gap={4} textAlign="center" px={4}>
                              <Box
                                bg="rgba(255,255,255,0.1)"
                                backdropFilter="blur(10px)"
                                p={6}
                                borderRadius="2xl"
                                borderWidth={1}
                                borderColor="rgba(255,255,255,0.2)"
                              >
                                <Text fontSize="5xl" mb={2}>📺</Text>
                                <Text color="white" fontSize="xl" fontWeight="bold">
                                  {selectedStream.titleAr || selectedStream.title}
                                </Text>
                                <Text color="gray.300" fontSize="sm" mt={1}>
                                  {selectedStream.descriptionAr || selectedStream.description}
                                </Text>
                              </Box>
                            </VStack>

                            {/* Live badge */}
                            <Box position="absolute" top={4} right={4} zIndex={3}>
                              <Badge
                                bg="red.500"
                                color="white"
                                fontSize="md"
                                px={3}
                                py={1}
                                borderRadius="full"
                                fontWeight="bold"
                              >
                                🔴 مباشر
                              </Badge>
                            </Box>

                            {/* Viewer count */}
                            <Box position="absolute" top={4} left={4} zIndex={3}>
                              <Badge
                                bg="rgba(0,0,0,0.6)"
                                color="white"
                                fontSize="sm"
                                px={3}
                                py={1}
                                borderRadius="full"
                              >
                                👁 {selectedStream.viewerCount.toLocaleString()} مشاهد
                              </Badge>
                            </Box>

                            {/* Started time */}
                            {selectedStream.startedAt && (
                              <Box position="absolute" bottom={4} left={4} zIndex={3}>
                                <Badge
                                  bg="rgba(0,0,0,0.6)"
                                  color="white"
                                  fontSize="xs"
                                  px={2}
                                  py={1}
                                  borderRadius="full"
                                >
                                  بدأ {formatTimeAgo(selectedStream.startedAt)}
                                </Badge>
                              </Box>
                            )}
                          </Box>

                          {/* Seller info bar */}
                          <HStack
                            bg="gray.800"
                            px={4}
                            py={3}
                            justify="space-between"
                            flexWrap="wrap"
                            gap={2}
                          >
                            <HStack gap={3}>
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                bg="red.500"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                color="white"
                                fontWeight="bold"
                                overflow="hidden"
                              >
                                {selectedStream.seller.image ? (
                                  <Image
                                    src={selectedStream.seller.image}
                                    alt={selectedStream.seller.storeName}
                                    width={40}
                                    height={40}
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                  />
                                ) : (
                                  selectedStream.seller.storeName.charAt(0)
                                )}
                              </Box>
                              <VStack align="start" gap={0}>
                                <Link href={`/stores/${selectedStream.seller.slug}`}>
                                  <Text color="white" fontWeight="bold" fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                                    {selectedStream.seller.storeName}
                                  </Text>
                                </Link>
                                {selectedStream.seller.ratingAvg > 0 && (
                                  <Text color="yellow.400" fontSize="xs">
                                    ⭐ {selectedStream.seller.ratingAvg.toFixed(1)}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                            <HStack gap={2}>
                              <Badge colorPalette="red" fontSize="xs">
                                👁 {selectedStream.viewerCount} مشاهد
                              </Badge>
                              <Badge colorPalette="gray" fontSize="xs">
                                🏆 ذروة: {selectedStream.peakViewers}
                              </Badge>
                            </HStack>
                          </HStack>

                          {/* Live Stream Products */}
                          {selectedStream.products.length > 0 && (
                            <Box bg="gray.50" p={4}>
                              <HStack mb={3} gap={2}>
                                <Text fontSize="lg">🏷️</Text>
                                <Text fontWeight="bold" color="black">
                                  عروض البث المباشر ({selectedStream.products.length} منتج)
                                </Text>
                              </HStack>
                              <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={3}>
                                {selectedStream.products.map((product) => (
                                  <Link key={product.id} href={`/products/${product.slug}`}>
                                    <Box
                                      bg="white"
                                      borderRadius="lg"
                                      overflow="hidden"
                                      borderWidth={1}
                                      borderColor="gray.200"
                                      _hover={{ borderColor: 'red.300', transform: 'translateY(-2px)' }}
                                      transition="all 0.2s"
                                    >
                                      <Box h="80px" bg="gray.100" position="relative">
                                        {product.image ? (
                                          <Image
                                            src={product.image}
                                            alt={product.title}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            sizes="150px"
                                            unoptimized
                                          />
                                        ) : (
                                          <VStack h="full" justify="center">
                                            <Text fontSize="2xl">📦</Text>
                                          </VStack>
                                        )}
                                        {product.discount && (
                                          <Badge
                                            position="absolute"
                                            top={1}
                                            right={1}
                                            bg="red.500"
                                            color="white"
                                            fontSize="xs"
                                            borderRadius="full"
                                          >
                                            -{product.discount}%
                                          </Badge>
                                        )}
                                      </Box>
                                      <VStack p={2} align="stretch" gap={1}>
                                        <Text fontSize="xs" fontWeight="bold" color="black" lineClamp={1}>
                                          {product.title}
                                        </Text>
                                        <HStack gap={1} flexWrap="wrap">
                                          {product.specialPrice ? (
                                            <>
                                              <Text fontSize="xs" fontWeight="bold" color="red.500">
                                                {product.specialPrice.toLocaleString()} ل.س
                                              </Text>
                                              <Text fontSize="xs" color="gray.400" textDecoration="line-through">
                                                {product.price.toLocaleString()}
                                              </Text>
                                            </>
                                          ) : (
                                            <Text fontSize="xs" fontWeight="bold" color="black">
                                              {product.price.toLocaleString()} ل.س
                                            </Text>
                                          )}
                                        </HStack>
                                      </VStack>
                                    </Box>
                                  </Link>
                                ))}
                              </SimpleGrid>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Other live streams (if more than one) */}
                      {liveStreams.length > 1 && (
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                          {liveStreams
                            .filter((s) => s.id !== selectedStream?.id)
                            .map((stream) => (
                              <Box
                                key={stream.id}
                                className="neon-card"
                                borderRadius="xl"
                                overflow="hidden"
                                cursor="pointer"
                                borderWidth={2}
                                borderColor="red.200"
                                _hover={{ borderColor: 'red.400', transform: 'translateY(-2px)' }}
                                transition="all 0.2s"
                                onClick={() => setSelectedStream(stream)}
                              >
                                <Box
                                  h="140px"
                                  bg="linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)"
                                  position="relative"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  {stream.thumbnail ? (
                                    <Image
                                      src={stream.thumbnail}
                                      alt={stream.titleAr || stream.title}
                                      fill
                                      style={{ objectFit: 'cover', opacity: 0.5 }}
                                      unoptimized
                                    />
                                  ) : null}
                                  <Text fontSize="3xl" position="relative" zIndex={2}>📺</Text>
                                  <Badge
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    bg="red.500"
                                    color="white"
                                    fontSize="xs"
                                    borderRadius="full"
                                  >
                                    🔴 مباشر
                                  </Badge>
                                  <Badge
                                    position="absolute"
                                    bottom={2}
                                    left={2}
                                    bg="rgba(0,0,0,0.6)"
                                    color="white"
                                    fontSize="xs"
                                    borderRadius="full"
                                  >
                                    👁 {stream.viewerCount}
                                  </Badge>
                                </Box>
                                <VStack p={3} align="stretch" gap={1}>
                                  <Text fontWeight="bold" color="black" fontSize="sm" lineClamp={1}>
                                    {stream.titleAr || stream.title}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {stream.seller.storeName}
                                  </Text>
                                  {stream.products.length > 0 && (
                                    <Badge colorPalette="red" fontSize="xs" w="fit-content">
                                      {stream.products.length} منتج معروض
                                    </Badge>
                                  )}
                                </VStack>
                              </Box>
                            ))}
                        </SimpleGrid>
                      )}
                    </VStack>
                  )}

                  {/* No Live Streams */}
                  {liveStreams.length === 0 && scheduledStreams.length === 0 && endedStreams.length === 0 && (
                    <VStack py={16} gap={6}>
                      <Box
                        bg="gray.50"
                        p={10}
                        borderRadius="2xl"
                        textAlign="center"
                        borderWidth={2}
                        borderColor="gray.200"
                        borderStyle="dashed"
                      >
                        <Text fontSize="5xl" mb={4}>📺</Text>
                        <Heading size="md" color="gray.600" mb={2}>
                          لا توجد بثوث مباشرة حالياً
                        </Heading>
                        <Text color="gray.500" fontSize="sm" mb={4}>
                          تابعنا لمعرفة مواعيد البثوث القادمة من البائعين
                        </Text>
                        <HStack justify="center" gap={3} flexWrap="wrap">
                          <Button
                            bg="red.500"
                            color="white"
                            _hover={{ bg: 'red.600' }}
                            onClick={() => setTab('trending')}
                          >
                            🔥 تصفح الرائج
                          </Button>
                          <Link href="/products">
                            <Button variant="outline" borderColor="black" color="black">
                              📦 كل المنتجات
                            </Button>
                          </Link>
                        </HStack>
                      </Box>
                    </VStack>
                  )}

                  {/* Scheduled Streams */}
                  {scheduledStreams.length > 0 && (
                    <VStack gap={4} align="stretch">
                      <HStack gap={2}>
                        <Text fontSize="xl">📅</Text>
                        <Heading size="md" color="black">
                          بثوث قادمة ({scheduledStreams.length})
                        </Heading>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                        {scheduledStreams.map((stream) => (
                          <Box
                            key={stream.id}
                            className="neon-card"
                            borderRadius="xl"
                            overflow="hidden"
                            borderWidth={2}
                            borderColor="blue.100"
                          >
                            <Box
                              h="120px"
                              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                              position="relative"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {stream.thumbnail ? (
                                <Image
                                  src={stream.thumbnail}
                                  alt={stream.titleAr || stream.title}
                                  fill
                                  style={{ objectFit: 'cover', opacity: 0.4 }}
                                  unoptimized
                                />
                              ) : null}
                              <VStack position="relative" zIndex={2} gap={1}>
                                <Text fontSize="2xl">⏰</Text>
                                <Text color="white" fontSize="sm" fontWeight="bold">
                                  {stream.scheduledAt ? formatScheduledDate(stream.scheduledAt) : 'قريباً'}
                                </Text>
                              </VStack>
                              <Badge
                                position="absolute"
                                top={2}
                                right={2}
                                bg="blue.500"
                                color="white"
                                fontSize="xs"
                                borderRadius="full"
                              >
                                📅 قادم
                              </Badge>
                            </Box>
                            <VStack p={3} align="stretch" gap={1}>
                              <Text fontWeight="bold" color="black" fontSize="sm" lineClamp={1}>
                                {stream.titleAr || stream.title}
                              </Text>
                              <HStack gap={2}>
                                <Box
                                  w="24px"
                                  h="24px"
                                  borderRadius="full"
                                  bg="blue.500"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  color="white"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  overflow="hidden"
                                >
                                  {stream.seller.image ? (
                                    <Image
                                      src={stream.seller.image}
                                      alt={stream.seller.storeName}
                                      width={24}
                                      height={24}
                                      unoptimized
                                    />
                                  ) : (
                                    stream.seller.storeName.charAt(0)
                                  )}
                                </Box>
                                <Text fontSize="xs" color="gray.500">
                                  {stream.seller.storeName}
                                </Text>
                              </HStack>
                              {stream.products.length > 0 && (
                                <Badge colorPalette="blue" fontSize="xs" w="fit-content">
                                  {stream.products.length} منتج للعرض
                                </Badge>
                              )}
                            </VStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  )}

                  {/* Past Streams */}
                  {endedStreams.length > 0 && (
                    <VStack gap={4} align="stretch">
                      <HStack gap={2}>
                        <Text fontSize="xl">📼</Text>
                        <Heading size="md" color="gray.600">
                          بثوث سابقة
                        </Heading>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
                        {endedStreams.map((stream) => (
                          <Box
                            key={stream.id}
                            className="neon-card"
                            borderRadius="xl"
                            overflow="hidden"
                            opacity={0.8}
                          >
                            <Box
                              h="100px"
                              bg="gray.200"
                              position="relative"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {stream.thumbnail ? (
                                <Image
                                  src={stream.thumbnail}
                                  alt={stream.titleAr || stream.title}
                                  fill
                                  style={{ objectFit: 'cover', opacity: 0.5 }}
                                  unoptimized
                                />
                              ) : null}
                              <Text fontSize="2xl" position="relative" zIndex={2}>📼</Text>
                              <Badge
                                position="absolute"
                                bottom={2}
                                left={2}
                                bg="rgba(0,0,0,0.5)"
                                color="white"
                                fontSize="xs"
                                borderRadius="full"
                              >
                                🏆 {stream.peakViewers} مشاهد
                              </Badge>
                            </Box>
                            <VStack p={3} align="stretch" gap={1}>
                              <Text fontWeight="bold" color="gray.700" fontSize="sm" lineClamp={1}>
                                {stream.titleAr || stream.title}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                {stream.seller.storeName}
                              </Text>
                              {stream.endedAt && (
                                <Text fontSize="xs" color="gray.400">
                                  انتهى {formatTimeAgo(stream.endedAt)}
                                </Text>
                              )}
                            </VStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  )}

                  {/* Live Features Info */}
                  <Box bg="gray.50" p={6} borderRadius="2xl">
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                      {[
                        { icon: '📺', title: 'بث مباشر', desc: 'شاهد عروض البائعين مباشرة' },
                        { icon: '🏷️', title: 'عروض حصرية', desc: 'خصومات خاصة أثناء البث' },
                        { icon: '💬', title: 'تفاعل مباشر', desc: 'تواصل مع البائع مباشرة' },
                        { icon: '🔔', title: 'إشعارات', desc: 'تنبيه عند بدء البث' },
                      ].map((f) => (
                        <HStack key={f.title} p={3} bg="white" borderRadius="lg" gap={3}>
                          <Text fontSize="2xl">{f.icon}</Text>
                          <VStack align="start" gap={0}>
                            <Text fontWeight="bold" color="black" fontSize="sm">{f.title}</Text>
                            <Text fontSize="xs" color="gray.500">{f.desc}</Text>
                          </VStack>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </Box>
                </>
              )}
            </VStack>
          )}

          {/* Products Tab Content */}
          {tab !== 'live' && (
            <>
              {loading ? (
                <VStack py={16}>
                  <Spinner size="xl" color="black" />
                  <Text color="gray.500">جاري التحميل...</Text>
                </VStack>
              ) : products.length === 0 ? (
                <VStack py={16} gap={4}>
                  <Text fontSize="5xl">📦</Text>
                  <Heading size="md" color="gray.600">
                    لا توجد منتجات حالياً
                  </Heading>
                  <Link href="/products">
                    <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                      تصفح كل المنتجات
                    </Button>
                  </Link>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
                  {products.map((product, index) => (
                    <Box
                      key={product.id}
                      className="neon-card"
                      borderRadius="xl"
                      overflow="hidden"
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-4px)' }}
                      position="relative"
                    >
                      {/* Rank badge for top 3 */}
                      {tab === 'trending' && index < 3 && (
                        <Box
                          position="absolute"
                          top={2}
                          right={2}
                          bg={index === 0 ? 'red.500' : index === 1 ? 'orange.400' : 'yellow.400'}
                          color="white"
                          fontWeight="bold"
                          fontSize="sm"
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          zIndex={2}
                        >
                          {index + 1}
                        </Box>
                      )}

                      {/* Save button */}
                      <Box
                        position="absolute"
                        top={2}
                        left={2}
                        zIndex={2}
                        cursor="pointer"
                        bg="white"
                        borderRadius="full"
                        w="32px"
                        h="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (savedStore.isSaved(product.id)) {
                            savedStore.removeItem(product.id);
                          } else {
                            savedStore.addItem({
                              productId: product.id,
                              title: product.titleAr || product.title,
                              price: Number(product.price),
                              image: product.images[0]?.url,
                              slug: product.slug,
                            });
                          }
                        }}
                      >
                        <Text fontSize="sm">{savedStore.isSaved(product.id) ? '♥' : '♡'}</Text>
                      </Box>

                      <Link href={`/products/${product.slug}`}>
                        {/* Image */}
                        <Box h="200px" bg="gray.100" overflow="hidden" position="relative">
                          {product.images[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.titleAr || product.title}
                              fill
                              style={{ objectFit: 'cover' }}
                              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                              unoptimized
                            />
                          ) : (
                            <VStack h="full" justify="center">
                              <Text fontSize="4xl">📦</Text>
                            </VStack>
                          )}
                        </Box>

                        {/* Info */}
                        <VStack p={4} align="stretch" gap={2}>
                          <Text fontWeight="bold" color="black" lineClamp={2}>
                            {product.titleAr || product.title}
                          </Text>

                          <HStack justify="space-between" flexWrap="wrap">
                            <Text fontWeight="bold" color="black" fontSize="lg">
                              {Number(product.price).toLocaleString()} ل.س
                            </Text>
                            <Badge colorPalette="gray" fontSize="xs">
                              {conditionLabels[product.condition] || product.condition}
                            </Badge>
                          </HStack>

                          <HStack justify="space-between">
                            <Text fontSize="xs" color="gray.500">
                              {product.seller?.storeName}
                            </Text>
                            {product.ratingCount > 0 && (
                              <HStack gap={1}>
                                <Text fontSize="xs" color="yellow.600">★ {Number(product.ratingAvg).toFixed(1)}</Text>
                                <Text fontSize="xs" color="gray.400">({product.ratingCount})</Text>
                              </HStack>
                            )}
                          </HStack>

                          {product.category && (
                            <Badge colorPalette="blue" fontSize="xs" w="fit-content">
                              {product.category.nameAr || product.category.name}
                            </Badge>
                          )}
                        </VStack>
                      </Link>

                      {/* Quick add to cart */}
                      <Box px={4} pb={4}>
                        <Button
                          size="sm"
                          w="full"
                          bg="black"
                          color="white"
                          _hover={{ bg: 'gray.800' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cartStore.addItem({
                              productId: product.id,
                              title: product.titleAr || product.title,
                              price: Number(product.price),
                              quantity: 1,
                              image: product.images[0]?.url,
                            });
                          }}
                        >
                          🛒 أضف للسلة
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </>
          )}

          {/* CTA */}
          <HStack justify="center" gap={4} flexWrap="wrap">
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                تصفح كل المنتجات
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" borderColor="black" color="black" size="lg">
                تصفح حسب الفئات
              </Button>
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
