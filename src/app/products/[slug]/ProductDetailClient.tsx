'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Spinner,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';
import { useCartStore, useSavedStore, useCompareStore } from '@/lib/store';
import SellerBadge from '@/components/SellerBadge';

interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  sortOrder?: number | null;
}

interface Product {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  price: number;
  quantity: number;
  condition: string;
  images: ProductImage[];
  category: { id: string; name: string; nameAr?: string } | null;
  seller: {
    id: string;
    storeName: string;
    slug: string;
    user: { name: string };
    verificationStatus?: string;
    verificationLevel?: string;
  };
  ratingAvg: number | null;
  ratingCount: number;
  ratingSummary?: {
    average: number | null;
    total: number;
    distribution: Record<string, number>;
  };
  reviews: {
    id: string;
    rating: number;
    comment: string;
    customer: { name: string };
    createdAt: string;
  }[];
}

export default function ProductDetailClient({
  initialProduct,
  slug,
}: {
  initialProduct: Product | null;
  slug: string;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const cartStore = useCartStore();
  const savedStore = useSavedStore();
  const compareStore = useCompareStore();

  useEffect(() => {
    if (!initialProduct && slug) {
      fetchProduct(slug);
    }
  }, [slug, initialProduct]);

  const fetchProduct = async (slugValue: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${slugValue}`);
      const data = await res.json();
      if (data.ok) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20}>
            <Spinner size="xl" color="black" />
            <Text color="gray.600">جاري التحميل...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20} gap={4}>
            <Heading color="black">المنتج غير موجود</Heading>
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                العودة للمنتجات
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  const conditionLabels: Record<string, string> = {
    NEW: 'جديد',
    LIKE_NEW: 'شبه جديد',
    GOOD: 'جيد',
    FAIR: 'مقبول',
  };

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={10}>
          {/* Images */}
          <VStack align="stretch" gap={4}>
            <Box
              h="400px"
              bg="gray.100"
              borderRadius="xl"
              overflow="hidden"
              borderWidth={2}
              borderColor="black"
              position="relative"
            >
              {product.images[selectedImage] ? (
                <>
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.titleAr || product.title}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <Button
                    size="sm"
                    position="absolute"
                    top={3}
                    right={3}
                    bg="white"
                    color="black"
                    borderWidth={1}
                    borderColor="black"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => window.open(product.images[selectedImage].url, '_blank')}
                  >
                    عرض الصورة
                  </Button>
                </>
              ) : (
                <VStack h="full" justify="center">
                  <Text color="gray.400" fontSize="xl">لا توجد صورة</Text>
                </VStack>
              )}
            </Box>
            {product.images.length > 1 && (
              <HStack gap={2} justify="center">
                {product.images.map((imgItem, idx) => (
                  <Box
                    key={imgItem.id}
                    w="80px"
                    h="80px"
                    bg="gray.100"
                    borderRadius="lg"
                    overflow="hidden"
                    borderWidth={2}
                    borderColor={selectedImage === idx ? 'black' : 'gray.200'}
                    cursor="pointer"
                    onClick={() => setSelectedImage(idx)}
                    position="relative"
                  >
                    <Image
                      src={imgItem.url}
                      alt={imgItem.alt || ''}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="80px"
                    />
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>

          {/* Details */}
          <VStack align="stretch" gap={6}>
            <VStack align="stretch" gap={2}>
              <HStack>
                <Badge bg="gray.100" color="gray.700" px={2} py={1}>
                  {product.category?.nameAr || product.category?.name || 'بدون فئة'}
                </Badge>
                <Badge bg="green.100" color="green.700" px={2} py={1}>
                  {conditionLabels[product.condition] || product.condition}
                </Badge>
              </HStack>
              <Heading size="xl" color="black">
                {product.titleAr || product.title}
              </Heading>
              <VStack align="start" gap={1}>
                <Link href={`/stores/${product.seller.slug}`}>
                  <Text color="gray.600" _hover={{ color: 'black' }}>
                    البائع: {product.seller.storeName}
                  </Text>
                </Link>
                <SellerBadge
                  level={product.seller.verificationLevel}
                  status={product.seller.verificationStatus}
                />
              </VStack>
            </VStack>

            {product.ratingAvg && (
              <HStack>
                <Text color="yellow.500" fontSize="xl">★</Text>
                <Text fontWeight="bold">{product.ratingAvg.toFixed(1)}</Text>
                <Text color="gray.600">({product.ratingCount} تقييم)</Text>
              </HStack>
            )}

            <Heading size="2xl" color="black">
              {Number(product.price).toLocaleString()} ل.س
            </Heading>

            {product.descriptionAr || product.description ? (
              <Text color="gray.700" whiteSpace="pre-wrap">
                {product.descriptionAr || product.description}
              </Text>
            ) : null}

            <HStack>
              <Text color={product.quantity > 0 ? 'green.600' : 'red.600'} fontWeight="bold">
                {product.quantity > 0 ? `متوفر (${product.quantity})` : 'غير متوفر'}
              </Text>
            </HStack>

            {/* ─── ACTION BUTTONS ─── */}
            {product.quantity > 0 && (
              <VStack gap={3} align="stretch">
                {/* Quantity selector */}
                <HStack>
                  <Text fontWeight="bold">الكمية:</Text>
                  <HStack>
                    <Button
                      size="sm" variant="outline" borderColor="black" color="black"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </Button>
                    <Text fontWeight="bold" minW="40px" textAlign="center">{quantity}</Text>
                    <Button
                      size="sm" variant="outline" borderColor="black" color="black"
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    >
                      +
                    </Button>
                  </HStack>
                </HStack>

                {/* Buy Now (cash) */}
                <Button
                  size="lg"
                  bg="black"
                  color="white"
                  _hover={{ bg: 'gray.800' }}
                  w="full"
                  onClick={() => {
                    cartStore.addItem({
                      productId: product.id,
                      title: product.titleAr || product.title,
                      price: Number(product.price),
                      quantity,
                      image: product.images[0]?.url,
                    });
                    router.push('/checkout');
                  }}
                >
                  شراء الآن — الدفع نقداً عند الاستلام
                </Button>

                {/* Add to Cart */}
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="black"
                  borderWidth={2}
                  color="black"
                  _hover={{ bg: 'gray.50' }}
                  w="full"
                  onClick={() => {
                    cartStore.addItem({
                      productId: product.id,
                      title: product.titleAr || product.title,
                      price: Number(product.price),
                      quantity,
                      image: product.images[0]?.url,
                    });
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                  }}
                >
                  {addedToCart ? 'تمت الإضافة' : 'أضف إلى السلة'}
                </Button>

                {/* Save + Compare row */}
                <HStack gap={3}>
                  <Button
                    flex={1}
                    size="md"
                    variant={savedStore.isSaved(product.id) ? 'solid' : 'outline'}
                    bg={savedStore.isSaved(product.id) ? 'red.500' : undefined}
                    color={savedStore.isSaved(product.id) ? 'white' : 'black'}
                    borderColor="black"
                    borderWidth={savedStore.isSaved(product.id) ? 0 : 2}
                    _hover={{ bg: savedStore.isSaved(product.id) ? 'red.600' : 'gray.50' }}
                    onClick={() => {
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
                    {savedStore.isSaved(product.id) ? 'محفوظ' : 'حفظ'}
                  </Button>

                  <Button
                    flex={1}
                    size="md"
                    variant={compareStore.isInCompare(product.id) ? 'solid' : 'outline'}
                    bg={compareStore.isInCompare(product.id) ? 'blue.500' : undefined}
                    color={compareStore.isInCompare(product.id) ? 'white' : 'black'}
                    borderColor="black"
                    borderWidth={compareStore.isInCompare(product.id) ? 0 : 2}
                    _hover={{ bg: compareStore.isInCompare(product.id) ? 'blue.600' : 'gray.50' }}
                    onClick={() => {
                      if (compareStore.isInCompare(product.id)) {
                        compareStore.removeItem(product.id);
                      } else {
                        compareStore.addItem({
                          productId: product.id,
                          title: product.titleAr || product.title,
                          price: Number(product.price),
                          image: product.images[0]?.url,
                          slug: product.slug,
                          condition: product.condition,
                          category: product.category?.nameAr || product.category?.name || undefined,
                          seller: product.seller.storeName,
                          rating: product.ratingAvg || undefined,
                        });
                      }
                    }}
                  >
                    {compareStore.isInCompare(product.id) ? 'في المقارنة' : 'قارن'}
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        </SimpleGrid>

        {/* Reviews */}
        <Box mt={16}>
          <Heading size="lg" color="black" mb={6}>
            التقييمات ({product.ratingCount})
          </Heading>
          {product.ratingSummary?.average ? (
            <HStack mb={4} gap={2}>
              <Text color="yellow.500" fontSize="lg">★</Text>
              <Text fontWeight="bold">{product.ratingSummary.average.toFixed(1)}</Text>
              <Text color="gray.600">من {product.ratingSummary.total} تقييم</Text>
            </HStack>
          ) : (
            <Text color="gray.600" mb={4}>لا توجد تقييمات بعد.</Text>
          )}

          {product.reviews.length === 0 ? (
            <Box p={4} borderWidth={2} borderColor="gray.200" borderRadius="lg">
              <Text color="gray.600">كن أول من يضيف تقييماً لهذا المنتج.</Text>
            </Box>
          ) : (
            <Stack gap={4}>
              {product.reviews.map((review) => (
                <Box
                  key={review.id}
                  p={4}
                  borderWidth={2}
                  borderColor="gray.200"
                  borderRadius="lg"
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack>
                      <Text fontWeight="bold">{review.customer.name}</Text>
                      <HStack gap={0}>
                        {[...Array(5)].map((_, i) => (
                          <Text key={i} color={i < review.rating ? 'yellow.500' : 'gray.300'}>
                            ★
                          </Text>
                        ))}
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(review.createdAt).toLocaleDateString('ar-SY')}
                    </Text>
                  </HStack>
                  {review.comment && (
                    <Text color="gray.700">{review.comment}</Text>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Q&A Placeholder */}
        <Box mt={12}>
          <Heading size="lg" color="black" mb={4}>الأسئلة والأجوبة</Heading>
          <Box p={4} borderWidth={2} borderColor="gray.200" borderRadius="lg">
            <Text color="gray.600">لا توجد أسئلة بعد. يمكنك طرح سؤال جديد قريباً.</Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
