'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Spinner,
  Button,
  Input,
  Switch,
} from '@chakra-ui/react';

interface AdminSettingsData {
  freeMode: boolean;
  globalCommissionRate: number;
  featureFlags: Record<string, unknown>;
  navConfig: NavConfig;
  cookieConsentConfig: CookieConsentConfig;
  searchConfig: SearchConfig;
  rankingWeights: Record<string, number>;
}

interface NavConfig {
  categories: NavCategoryItem[];
  showAll: boolean;
  [key: string]: unknown;
}

interface NavCategoryItem {
  slug: string;
  label: string;
  labelAr: string;
  visible: boolean;
  order: number;
}

interface CookieConsentConfig {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  [key: string]: unknown;
}

interface SearchConfig {
  advancedEnabled: boolean;
  filtersEnabled: boolean;
  suggestionsEnabled: boolean;
  [key: string]: unknown;
}

interface CategoryData {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, catRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/categories?limit=100'),
      ]);
      const settingsData = await settingsRes.json();
      const catData = await catRes.json();

      if (settingsData.ok) {
        const s = settingsData.data;
        setSettings({
          freeMode: s.freeMode,
          globalCommissionRate: Number(s.globalCommissionRate),
          featureFlags: (s.featureFlags as Record<string, unknown>) || {},
          navConfig: (s.navConfig as NavConfig) || { categories: [], showAll: true },
          cookieConsentConfig: (s.cookieConsentConfig as CookieConsentConfig) || { analytics: false, marketing: false, functional: true },
          searchConfig: (s.searchConfig as SearchConfig) || { advancedEnabled: true, filtersEnabled: true, suggestionsEnabled: true },
          rankingWeights: (s.rankingWeights as Record<string, number>) || {},
        });
      }
      if (catData.ok) {
        setCategories(catData.data.items || catData.data || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, fetchSettings]);

  const saveSection = async (section: string, data: Record<string, unknown>) => {
    setSaving(section);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.ok) {
        setMessage({ type: 'success', text: 'تم الحفظ بنجاح' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error?.message || 'فشل الحفظ' });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ في الشبكة' });
    } finally {
      setSaving(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="5xl">
          <VStack py={20}><Spinner size="xl" color="black" /></VStack>
        </Container>
      </Box>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="md">
          <VStack gap={4}>
            <Heading color="black">غير مصرح لك</Heading>
            <Link href="/"><Button bg="black" color="white">العودة</Button></Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!settings) return null;

  const featureFlagItems: { key: string; label: string; desc: string }[] = [
    { key: 'sesLive', label: 'SES Live', desc: 'بث مباشر للمنتجات والعروض' },
    { key: 'saved', label: 'المحفوظات', desc: 'قائمة المنتجات المحفوظة للمستخدم' },
    { key: 'smallBusiness', label: 'الأعمال الصغيرة', desc: 'قسم خاص للأعمال الصغيرة' },
    { key: 'advancedSearch', label: 'البحث المتقدم', desc: 'تفعيل واجهة البحث المتقدم' },
    { key: 'cookieConsent', label: 'إشعار الكوكيز', desc: 'عرض لوح قبول الكوكيز' },
  ];

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="5xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading size="xl" color="black">إعدادات النظام</Heading>
              <Text color="gray.600">إدارة الميزات والإعدادات العامة</Text>
            </VStack>
            <HStack gap={2}>
              <Link href="/admin/dashboard">
                <Button variant="outline" borderColor="black" color="black">لوحة التحكم</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" borderColor="black" color="black">الإدارة</Button>
              </Link>
            </HStack>
          </HStack>

          {/* Status Message */}
          {message && (
            <Box
              p={4}
              borderRadius="lg"
              bg={message.type === 'success' ? 'green.50' : 'red.50'}
              borderWidth={1}
              borderColor={message.type === 'success' ? 'green.200' : 'red.200'}
            >
              <Text color={message.type === 'success' ? 'green.700' : 'red.700'} fontWeight="bold">
                {message.text}
              </Text>
            </Box>
          )}

          {/* ═══════════════ FEATURE FLAGS ═══════════════ */}
          <Box className="neon-card" p={6}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Heading size="md" color="black">أعلام الميزات</Heading>
                {saving === 'flags' && <Spinner size="sm" />}
              </HStack>
              <Text fontSize="sm" color="gray.600">
                تشغيل أو إيقاف ميزات الموقع. التغييرات تؤثر فوراً على جميع المستخدمين.
              </Text>

              {featureFlagItems.map(({ key, label, desc }) => (
                <HStack key={key} justify="space-between" p={4} bg="gray.50" borderRadius="lg">
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold">{label}</Text>
                    <Text fontSize="sm" color="gray.500">{desc}</Text>
                  </VStack>
                  <Switch.Root
                    checked={!!settings.featureFlags[key]}
                    onCheckedChange={(details) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              featureFlags: { ...prev.featureFlags, [key]: details.checked },
                            }
                          : prev
                      )
                    }
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>
              ))}

              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                loading={saving === 'flags'}
                onClick={() => saveSection('flags', { featureFlags: settings.featureFlags })}
              >
                حفظ أعلام الميزات
              </Button>
            </VStack>
          </Box>

          {/* ═══════════════ NAVIGATION CONFIG ═══════════════ */}
          <Box className="neon-card" p={6}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Heading size="md" color="black">إعدادات التنقل</Heading>
                {saving === 'nav' && <Spinner size="sm" />}
              </HStack>
              <Text fontSize="sm" color="gray.600">
                تحكم بالفئات التي تظهر في شريط التنقل وترتيبها.
              </Text>

              <HStack justify="space-between" p={4} bg="gray.50" borderRadius="lg">
                <VStack align="start" gap={0}>
                  <Text fontWeight="bold">عرض جميع الفئات</Text>
                  <Text fontSize="sm" color="gray.500">عرض كل الفئات النشطة في الشريط</Text>
                </VStack>
                <Switch.Root
                  checked={!!settings.navConfig.showAll}
                  onCheckedChange={(details) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            navConfig: { ...prev.navConfig, showAll: details.checked },
                          }
                        : prev
                    )
                  }
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </HStack>

              {!settings.navConfig.showAll && categories.length > 0 && (
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="bold" fontSize="sm">الفئات المختارة:</Text>
                  {categories.map((cat) => {
                    const navItem = settings.navConfig.categories?.find(
                      (c) => c.slug === cat.slug
                    );
                    const isVisible = navItem?.visible ?? true;
                    return (
                      <HStack key={cat.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                        <HStack gap={3}>
                          <Text fontSize="sm" fontWeight="bold">{cat.nameAr || cat.name}</Text>
                          <Badge size="sm" colorPalette="gray">{cat.slug}</Badge>
                        </HStack>
                        <HStack gap={3}>
                          <Input
                            type="number"
                            w="70px"
                            size="sm"
                            placeholder="ترتيب"
                            value={navItem?.order ?? cat.sortOrder}
                            onChange={(e) => {
                              const order = parseInt(e.target.value) || 0;
                              setSettings((prev) => {
                                if (!prev) return prev;
                                const cats = [...(prev.navConfig.categories || [])];
                                const idx = cats.findIndex((c) => c.slug === cat.slug);
                                const item = {
                                  slug: cat.slug,
                                  label: cat.name,
                                  labelAr: cat.nameAr || cat.name,
                                  visible: isVisible,
                                  order,
                                };
                                if (idx >= 0) cats[idx] = item;
                                else cats.push(item);
                                return { ...prev, navConfig: { ...prev.navConfig, categories: cats } };
                              });
                            }}
                            borderWidth={1}
                            borderColor="gray.300"
                          />
                          <Switch.Root
                            checked={isVisible}
                            onCheckedChange={(details) => {
                              setSettings((prev) => {
                                if (!prev) return prev;
                                const cats = [...(prev.navConfig.categories || [])];
                                const idx = cats.findIndex((c) => c.slug === cat.slug);
                                const item = {
                                  slug: cat.slug,
                                  label: cat.name,
                                  labelAr: cat.nameAr || cat.name,
                                  visible: details.checked,
                                  order: navItem?.order ?? cat.sortOrder,
                                };
                                if (idx >= 0) cats[idx] = item;
                                else cats.push(item);
                                return { ...prev, navConfig: { ...prev.navConfig, categories: cats } };
                              });
                            }}
                          >
                            <Switch.HiddenInput />
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Root>
                        </HStack>
                      </HStack>
                    );
                  })}
                </VStack>
              )}

              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                loading={saving === 'nav'}
                onClick={() => saveSection('nav', { navConfig: settings.navConfig })}
              >
                حفظ إعدادات التنقل
              </Button>
            </VStack>
          </Box>

          {/* ═══════════════ SEARCH CONFIG ═══════════════ */}
          <Box className="neon-card" p={6}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Heading size="md" color="black">إعدادات البحث</Heading>
                {saving === 'search' && <Spinner size="sm" />}
              </HStack>

              {([
                { key: 'advancedEnabled', label: 'البحث المتقدم', desc: 'تفعيل واجهة البحث المتقدم مع الفلاتر' },
                { key: 'filtersEnabled', label: 'فلاتر جانبية', desc: 'عرض فلاتر الفئة والسعر والحالة' },
                { key: 'suggestionsEnabled', label: 'اقتراحات البحث', desc: 'عرض اقتراحات تلقائية أثناء الكتابة' },
              ] as const).map(({ key, label, desc }) => (
                <HStack key={key} justify="space-between" p={4} bg="gray.50" borderRadius="lg">
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold">{label}</Text>
                    <Text fontSize="sm" color="gray.500">{desc}</Text>
                  </VStack>
                  <Switch.Root
                    checked={!!settings.searchConfig[key]}
                    onCheckedChange={(details) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              searchConfig: { ...prev.searchConfig, [key]: details.checked },
                            }
                          : prev
                      )
                    }
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>
              ))}

              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                loading={saving === 'search'}
                onClick={() => saveSection('search', { searchConfig: settings.searchConfig })}
              >
                حفظ إعدادات البحث
              </Button>
            </VStack>
          </Box>

          {/* ═══════════════ COOKIE CONSENT CONFIG ═══════════════ */}
          <Box className="neon-card" p={6}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Heading size="md" color="black">إعدادات الكوكيز</Heading>
                {saving === 'cookie' && <Spinner size="sm" />}
              </HStack>
              <Text fontSize="sm" color="gray.600">
                القيم الافتراضية لخيارات الكوكيز عند عرض لوح الموافقة للزوار.
              </Text>

              {([
                { key: 'functional', label: 'كوكيز وظيفية', desc: 'ضرورية لعمل الموقع بشكل صحيح' },
                { key: 'analytics', label: 'كوكيز تحليلية', desc: 'لتتبع الإحصائيات وتحسين الأداء' },
                { key: 'marketing', label: 'كوكيز تسويقية', desc: 'لعرض إعلانات مخصصة' },
              ] as const).map(({ key, label, desc }) => (
                <HStack key={key} justify="space-between" p={4} bg="gray.50" borderRadius="lg">
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold">{label}</Text>
                    <Text fontSize="sm" color="gray.500">{desc}</Text>
                  </VStack>
                  <Switch.Root
                    checked={!!settings.cookieConsentConfig[key]}
                    onCheckedChange={(details) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              cookieConsentConfig: {
                                ...prev.cookieConsentConfig,
                                [key]: details.checked,
                              },
                            }
                          : prev
                      )
                    }
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>
              ))}

              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                loading={saving === 'cookie'}
                onClick={() =>
                  saveSection('cookie', {
                    cookieConsentConfig: settings.cookieConsentConfig,
                  })
                }
              >
                حفظ إعدادات الكوكيز
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
