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
  Button,
  Input,
  Textarea,
  Spinner,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  wizardStep1Schema,
  wizardStep2Schema,
  wizardStep3Schema,
  wizardStep4Schema,
} from '@/lib/validations';


interface Category {
  id: string;
  name: string;
  nameAr: string | null;
}

interface WizardData {
  // Step 1
  title: string;
  titleAr: string;
  categoryId: string;
  brand: string;
  // Step 2
  description: string;
  descriptionAr: string;
  condition: string;
  tags: string[];
  // Step 3
  price: number;
  currency: string;
  quantity: number;
  // Step 4
  slug: string;
}

const conditionLabels: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'كالجديد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'رديء',
};

const STEPS = [
  { id: 1, title: 'المعلومات الأساسية', icon: '📝' },
  { id: 2, title: 'الوصف والحالة', icon: '📋' },
  { id: 3, title: 'السعر والكمية', icon: '💰' },
  { id: 4, title: 'المراجعة والنشر', icon: '✅' },
];

export default function NewProductWizard() {
  const { status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [slugError, setSlugError] = useState('');

  const [data, setData] = useState<WizardData>({
    title: '',
    titleAr: '',
    categoryId: '',
    brand: '',
    description: '',
    descriptionAr: '',
    condition: 'NEW',
    tags: [],
    price: 0,
    currency: 'SYP',
    quantity: 1,
    slug: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (data.title && !data.slug) {
      const generatedSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [data.title]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    setErrors({});
    try {
      switch (step) {
        case 1:
          wizardStep1Schema.parse({
            title: data.title,
            titleAr: data.titleAr || undefined,
            categoryId: data.categoryId || undefined,
            brand: data.brand || undefined,
          });
          break;
        case 2:
          wizardStep2Schema.parse({
            description: data.description,
            descriptionAr: data.descriptionAr || undefined,
            condition: data.condition,
            tags: data.tags,
          });
          break;
        case 3:
          wizardStep3Schema.parse({
            price: data.price,
            currency: data.currency,
            quantity: data.quantity,
          });
          break;
        case 4:
          wizardStep4Schema.parse({
            slug: data.slug,
          });
          break;
      }
      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const zodError = err as { errors: Array<{ path: string[]; message: string }> };
        const newErrors: Record<string, string> = {};
        zodError.errors.forEach((e) => {
          newErrors[e.path.join('.')] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const checkSlugAvailability = async () => {
    if (!data.slug) return;
    try {
      const res = await fetch(`/api/products/${data.slug}`);
      if (res.ok) {
        setSlugError('هذا الرابط مستخدم بالفعل');
      } else {
        setSlugError('');
      }
    } catch {
      // Slug is available
      setSlugError('');
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        checkSlugAvailability();
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !data.tags.includes(tag) && data.tags.length < 10) {
      setData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    if (slugError) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          titleAr: data.titleAr || undefined,
          slug: data.slug,
          description: data.description,
          descriptionAr: data.descriptionAr || undefined,
          condition: data.condition,
          price: data.price,
          currency: data.currency,
          quantity: data.quantity,
          categoryId: data.categoryId || undefined,
          brand: data.brand || undefined,
          tags: data.tags,
        }),
      });

      const result = await res.json();
      if (result.success) {
        router.push('/seller/products');
      } else {
        setErrors({ submit: result.error || 'حدث خطأ أثناء إنشاء المنتج' });
      }
    } catch (error) {
      setErrors({ submit: 'حدث خطأ في الاتصال' });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="4xl">
          <VStack py={20}>
            <Spinner size="xl" color="black" />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <Box minH="100vh" bg="white" py={6}>
      <Container maxW="4xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <Heading size="xl" color="black">
              إضافة منتج جديد
            </Heading>
            <Text color="gray.600">
              أكمل الخطوات التالية لنشر منتجك
            </Text>
          </VStack>

          {/* Progress Steps */}
          <HStack
            justify="center"
            gap={{ base: 2, md: 4 }}
            flexWrap="wrap"
            pb={4}
          >
            {STEPS.map((step, index) => (
              <HStack key={step.id} gap={2}>
                <VStack
                  gap={1}
                  cursor={step.id < currentStep ? 'pointer' : 'default'}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  opacity={step.id > currentStep ? 0.5 : 1}
                >
                  <Box
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    bg={step.id <= currentStep ? 'black' : 'gray.200'}
                    color={step.id <= currentStep ? 'white' : 'gray.500'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </Box>
                  <Text
                    fontSize="xs"
                    color={step.id <= currentStep ? 'black' : 'gray.400'}
                    display={{ base: 'none', md: 'block' }}
                  >
                    {step.title}
                  </Text>
                </VStack>
                {index < STEPS.length - 1 && (
                  <Box
                    w={{ base: '20px', md: '40px' }}
                    h="2px"
                    bg={step.id < currentStep ? 'black' : 'gray.200'}
                  />
                )}
              </HStack>
            ))}
          </HStack>

          {/* Step Content */}
          <Box
            borderWidth={2}
            borderColor="black"
            borderRadius="xl"
            boxShadow="4px 4px 0 0 black"
            p={{ base: 4, md: 8 }}
          >
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <VStack gap={6} align="stretch">
                <HStack gap={2}>
                  <Text fontSize="2xl">{STEPS[0].icon}</Text>
                  <Heading size="lg" color="black">
                    {STEPS[0].title}
                  </Heading>
                </HStack>

                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      عنوان المنتج (بالإنجليزية) *
                    </Text>
                    <Input
                      placeholder="Product Title"
                      value={data.title}
                      onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                      borderColor={errors.title ? 'red.500' : 'black'}
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                    {errors.title && (
                      <Text color="red.500" fontSize="sm" mt={1}>{errors.title}</Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      عنوان المنتج (بالعربية)
                    </Text>
                    <Input
                      placeholder="عنوان المنتج"
                      value={data.titleAr}
                      onChange={(e) => setData((prev) => ({ ...prev, titleAr: e.target.value }))}
                      borderColor="black"
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      الفئة
                    </Text>
                    <select
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderWidth: '1px',
                        borderColor: 'black',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                      }}
                      value={data.categoryId}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                    >
                      <option value="">-- اختر الفئة --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameAr || cat.name}
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      العلامة التجارية
                    </Text>
                    <Input
                      placeholder="Brand"
                      value={data.brand}
                      onChange={(e) => setData((prev) => ({ ...prev, brand: e.target.value }))}
                      borderColor="black"
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                  </Box>
                </VStack>
              </VStack>
            )}

            {/* Step 2: Description & Condition */}
            {currentStep === 2 && (
              <VStack gap={6} align="stretch">
                <HStack gap={2}>
                  <Text fontSize="2xl">{STEPS[1].icon}</Text>
                  <Heading size="lg" color="black">
                    {STEPS[1].title}
                  </Heading>
                </HStack>

                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      الوصف (بالإنجليزية) *
                    </Text>
                    <Textarea
                      placeholder="Product description..."
                      value={data.description}
                      onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      borderColor={errors.description ? 'red.500' : 'black'}
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                    {errors.description && (
                      <Text color="red.500" fontSize="sm" mt={1}>{errors.description}</Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      الوصف (بالعربية)
                    </Text>
                    <Textarea
                      placeholder="وصف المنتج..."
                      value={data.descriptionAr}
                      onChange={(e) => setData((prev) => ({ ...prev, descriptionAr: e.target.value }))}
                      rows={4}
                      borderColor="black"
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      حالة المنتج *
                    </Text>
                    <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} gap={2}>
                      {Object.entries(conditionLabels).map(([key, label]) => (
                        <Button
                          key={key}
                          size="sm"
                          variant={data.condition === key ? 'solid' : 'outline'}
                          bg={data.condition === key ? 'black' : 'white'}
                          color={data.condition === key ? 'white' : 'black'}
                          borderColor="black"
                          _hover={{ bg: data.condition === key ? 'gray.800' : 'gray.100' }}
                          onClick={() => setData((prev) => ({ ...prev, condition: key }))}
                        >
                          {label}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      العلامات (Tags)
                    </Text>
                    <HStack gap={2}>
                      <Input
                        placeholder="أضف علامة..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        borderColor="black"
                        flex={1}
                      />
                      <Button
                        onClick={handleAddTag}
                        bg="black"
                        color="white"
                        _hover={{ bg: 'gray.800' }}
                      >
                        إضافة
                      </Button>
                    </HStack>
                    {data.tags.length > 0 && (
                      <HStack gap={2} mt={3} flexWrap="wrap">
                        {data.tags.map((tag) => (
                          <Badge
                            key={tag}
                            px={3}
                            py={1}
                            borderRadius="full"
                            bg="gray.100"
                            color="black"
                            cursor="pointer"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            {tag} ✕
                          </Badge>
                        ))}
                      </HStack>
                    )}
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {data.tags.length}/10 علامات
                    </Text>
                  </Box>
                </VStack>
              </VStack>
            )}

            {/* Step 3: Price & Quantity */}
            {currentStep === 3 && (
              <VStack gap={6} align="stretch">
                <HStack gap={2}>
                  <Text fontSize="2xl">{STEPS[2].icon}</Text>
                  <Heading size="lg" color="black">
                    {STEPS[2].title}
                  </Heading>
                </HStack>

                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      السعر (ل.س) *
                    </Text>
                    <Input
                      type="number"
                      placeholder="0"
                      value={data.price || ''}
                      onChange={(e) => setData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      borderColor={errors.price ? 'red.500' : 'black'}
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                    {errors.price && (
                      <Text color="red.500" fontSize="sm" mt={1}>{errors.price}</Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="black">
                      الكمية المتاحة *
                    </Text>
                    <Input
                      type="number"
                      placeholder="1"
                      value={data.quantity || ''}
                      onChange={(e) => setData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      borderColor={errors.quantity ? 'red.500' : 'black'}
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'black', boxShadow: 'none' }}
                    />
                    {errors.quantity && (
                      <Text color="red.500" fontSize="sm" mt={1}>{errors.quantity}</Text>
                    )}
                  </Box>
                </VStack>
              </VStack>
            )}

            {/* Step 4: Review & Publish */}
            {currentStep === 4 && (
              <VStack gap={6} align="stretch">
                <HStack gap={2}>
                  <Text fontSize="2xl">{STEPS[3].icon}</Text>
                  <Heading size="lg" color="black">
                    {STEPS[3].title}
                  </Heading>
                </HStack>

                <Box>
                  <Text fontWeight="bold" mb={2} color="black">
                    رابط المنتج (Slug) *
                  </Text>
                  <Input
                    placeholder="product-slug"
                    value={data.slug}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setData((prev) => ({ ...prev, slug: value }));
                      setSlugError('');
                    }}
                    onBlur={checkSlugAvailability}
                    borderColor={errors.slug || slugError ? 'red.500' : 'black'}
                    _hover={{ borderColor: 'gray.600' }}
                    _focus={{ borderColor: 'black', boxShadow: 'none' }}
                  />
                  {(errors.slug || slugError) && (
                    <Text color="red.500" fontSize="sm" mt={1}>{errors.slug || slugError}</Text>
                  )}
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    الرابط: /products/{data.slug || 'your-product'}
                  </Text>
                </Box>

                {/* Summary */}
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor="gray.200"
                >
                  <Text fontWeight="bold" mb={3} color="black">
                    ملخص المنتج:
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">العنوان:</Text>
                      <Text fontWeight="medium">{data.titleAr || data.title || '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">الفئة:</Text>
                      <Text fontWeight="medium">
                        {categories.find((c) => c.id === data.categoryId)?.nameAr ||
                          categories.find((c) => c.id === data.categoryId)?.name || '-'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">الحالة:</Text>
                      <Text fontWeight="medium">{conditionLabels[data.condition]}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">العلامة التجارية:</Text>
                      <Text fontWeight="medium">{data.brand || '-'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">السعر:</Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {data.price.toLocaleString()} ل.س
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">الكمية:</Text>
                      <Text fontWeight="medium">{data.quantity}</Text>
                    </Box>
                  </SimpleGrid>
                  {data.tags.length > 0 && (
                    <Box mt={3}>
                      <Text fontSize="sm" color="gray.500">العلامات:</Text>
                      <HStack gap={1} mt={1} flexWrap="wrap">
                        {data.tags.map((tag) => (
                          <Badge key={tag} size="sm" bg="gray.200">{tag}</Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </Box>

                {errors.submit && (
                  <Box p={3} bg="red.50" borderRadius="md" borderWidth={1} borderColor="red.200">
                    <Text color="red.600">{errors.submit}</Text>
                  </Box>
                )}
              </VStack>
            )}

            {/* Navigation Buttons */}
            <HStack justify="space-between" mt={8} flexWrap="wrap" gap={2}>
              <Button
                variant="outline"
                borderColor="black"
                color="black"
                onClick={handleBack}
                visibility={currentStep === 1 ? 'hidden' : 'visible'}
                _hover={{ bg: 'gray.100' }}
              >
                السابق
              </Button>

              {currentStep < 4 ? (
                <Button
                  bg="black"
                  color="white"
                  onClick={handleNext}
                  _hover={{ bg: 'gray.800' }}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  bg="black"
                  color="white"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!!slugError}
                  _hover={{ bg: 'gray.800' }}
                >
                  نشر المنتج
                </Button>
              )}
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
