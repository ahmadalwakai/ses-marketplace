'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  HStack,
  VStack,
  Button,
  Text,
  Input,
  Spinner,
} from '@chakra-ui/react';
import { useWishlistStore, useCompareStore, useUIStore, useSearchStore, useCategoryMenuStore, useSavedStore, useCartStore } from '@/lib/store';
import { useColorMode, useColorModeValue } from '@/theme';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const wishlistItems = useWishlistStore((state) => state.items);
  const compareItems = useCompareStore((state) => state.items);
  const cartItems = useCartStore((state) => state.items);
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { query, setQuery, suggestions, setSuggestions, isSearching, setIsSearching, clearSuggestions, showAdvanced, toggleAdvanced } = useSearchStore();
  const savedItems = useSavedStore((state) => state.items);
  const { categories: menuCategories, isOpen: categoryMenuOpen, expandedIds, isLoading: categoriesLoading, setCategories: setMenuCategories, setIsOpen: setCategoryMenuOpen, toggleOpen: toggleCategoryMenu, toggleExpanded, setIsLoading: setCategoriesLoading } = useCategoryMenuStore();

  // Color mode
  const { colorMode, toggleColorMode } = useColorMode();
  const navBg = useColorModeValue('var(--ses-nav)', '#0b1220');
  const textClr = useColorModeValue('var(--ses-nav-ink)', '#e7edf5');
  const borderClr = useColorModeValue('#0b2346', '#1a2b44');
  const hoverBg = useColorModeValue('#143768', '#1d3354');
  const activeBg = useColorModeValue('#1b3f74', '#223a5f');
  const mutedClr = useColorModeValue('#c7d4e6', '#b7c3d6');
  const dimClr = useColorModeValue('#9fb1c7', '#95a8c1');
  const subBorder = useColorModeValue('#1a3c6c', '#1d3354');
  const shadowBox = useColorModeValue('0 12px 28px rgba(8, 22, 40, 0.35)', '0 12px 28px rgba(0, 0, 0, 0.5)');
  const focusShadow = useColorModeValue('0 0 0 2px rgba(240, 138, 36, 0.5)', '0 0 0 2px rgba(240, 138, 36, 0.5)');
  const btnBg = useColorModeValue('var(--ses-orange)', 'var(--ses-orange)');
  const btnClr = useColorModeValue('#1b1b1b', '#1b1b1b');
  const btnHoverBg = useColorModeValue('var(--ses-orange-dark)', 'var(--ses-orange-dark)');
  const accentBg = useColorModeValue('#162d52', '#1d3354');

  const [localQuery, setLocalQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(localQuery, 300);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Fetch categories for menu
  useEffect(() => {
    const fetchCategories = async () => {
      if (menuCategories.length > 0) return;
      setCategoriesLoading(true);
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setMenuCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [menuCategories.length, setMenuCategories, setCategoriesLoading]);

  // Fetch notifications
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        if (status === 'authenticated') {
          fetchNotifications();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session]);
  
  const fetchNotifications = async () => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated') return;
    
    try {
      const res = await fetch('/api/notifications/me?limit=10');
      if (!res.ok) return; // Silently fail on 401/403
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      // Silently ignore notification fetch errors
    }
  };
  
  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await fetch('/api/notifications/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notification.id] }),
      });
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setShowNotifications(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Close notifications/category menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setCategoryMenuOpen]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!showSuggestions) return;

    const q = debouncedQuery.trim();
    const url = q.length >= 2
      ? `/api/search?mode=autocomplete&q=${encodeURIComponent(q)}&limit=5`
      : `/api/search?mode=autocomplete&limit=6`;

    setIsSearching(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setSuggestions(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsSearching(false));
  }, [debouncedQuery, showSuggestions, setSuggestions, setIsSearching]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setQuery(localQuery);
      setShowSuggestions(false);
      router.push(`/products?q=${encodeURIComponent(localQuery.trim())}`);
    }
  }, [localQuery, setQuery, router]);

  const handleSmartSearch = useCallback(async () => {
    if (!localQuery.trim()) return;
    setSmartSearchLoading(true);
    try {
      const res = await fetch('/api/ai/customer/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: localQuery.trim(), language: 'ar' }),
      });
      const result = await res.json();
      if (result.ok && result.data) {
        const params = new URLSearchParams();
        if (result.data.expandedQuery) params.set('q', result.data.expandedQuery);
        const sf = result.data.suggestedFilters;
        if (sf?.priceRange?.min) params.set('minPrice', String(sf.priceRange.min));
        if (sf?.priceRange?.max) params.set('maxPrice', String(sf.priceRange.max));
        if (sf?.conditions?.[0]) params.set('condition', sf.conditions[0]);
        setShowSuggestions(false);
        setQuery(result.data.expandedQuery || localQuery);
        router.push(`/products?${params.toString()}`);
      }
    } catch (err) {
      console.error('Smart search error:', err);
    } finally {
      setSmartSearchLoading(false);
    }
  }, [localQuery, router, setQuery]);

  const handleSuggestionClick = (item: { type: 'product' | 'search'; slug?: string; query?: string; title: string }) => {
    setShowSuggestions(false);
    setLocalQuery('');
    if (item.type === 'product' && item.slug) {
      router.push(`/products/${item.slug}`);
      return;
    }
    const searchQuery = item.query || item.title;
    setQuery(searchQuery);
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <Box
        as="nav"
        bg={navBg}
        borderBottomWidth={2}
        borderColor={borderClr}
        position="sticky"
        top={0}
        zIndex={100}
        transition="background-color 0.3s ease"
      >
        <Container maxW="7xl" py={3}>
          <VStack gap={3} align="stretch">
            {/* Top Row: Logo + Auth */}
            <HStack justify="space-between">
              {/* Mobile Menu Button */}
              <Button
                display={{ base: 'flex', md: 'none' }}
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                p={2}
                aria-label="القائمة"
              >
                <Text fontSize="xl">{mobileMenuOpen ? 'X' : '≡'}</Text>
              </Button>

              {/* Logo */}
              <Link href="/">
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={textClr}>
                  SES سوريا
                </Text>
              </Link>

              {/* Desktop Nav Links */}
              <HStack gap={4} display={{ base: 'none', md: 'flex' }}>
                {/* Shop by Category dropdown */}
                <Box ref={categoryMenuRef} position="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategoryMenu()}
                    color={textClr}
                    fontWeight="medium"
                  >
                    <Text fontSize="sm">تسوق حسب الفئة</Text>
                    <Text fontSize="xs" ml={1}>{categoryMenuOpen ? '▲' : '▼'}</Text>
                  </Button>

                  {categoryMenuOpen && (
                    <Box
                      position="absolute"
                      top="100%"
                      right={0}
                      w="280px"
                      bg={navBg}
                      borderWidth={2}
                      borderColor={borderClr}
                      borderRadius="lg"
                      boxShadow={shadowBox}
                      zIndex={300}
                      maxH="400px"
                      overflowY="auto"
                    >
                      <HStack p={3} borderBottomWidth={1} borderColor={subBorder} justify="space-between">
                        <Text fontWeight="bold" fontSize="sm">تسوق حسب الفئة</Text>
                        <Link href="/categories" onClick={() => setCategoryMenuOpen(false)}>
                          <Text fontSize="xs" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                            كل الفئات
                          </Text>
                        </Link>
                      </HStack>
                      {categoriesLoading ? (
                        <HStack p={4} justify="center"><Spinner size="sm" /></HStack>
                      ) : (
                        <VStack align="stretch" gap={0}>
                          {menuCategories.map((cat) => (
                            <Box key={cat.id}>
                              <HStack
                                p={3}
                                cursor="pointer"
                                _hover={{ bg: hoverBg }}
                                justify="space-between"
                              >
                                <Link
                                  href={`/categories/${cat.slug}`}
                                  onClick={() => setCategoryMenuOpen(false)}
                                  style={{ flex: 1 }}
                                >
                                  <Text fontSize="sm" color={textClr}>
                                    {cat.nameAr || cat.name}
                                  </Text>
                                </Link>
                                {cat.children && cat.children.length > 0 && (
                                  <Text
                                    fontSize="xs"
                                    color={dimClr}
                                    cursor="pointer"
                                    onClick={(e) => { e.stopPropagation(); toggleExpanded(cat.id); }}
                                    px={2}
                                  >
                                    {expandedIds.includes(cat.id) ? '▲' : '▼'}
                                  </Text>
                                )}
                              </HStack>
                              {expandedIds.includes(cat.id) && cat.children && (
                                <VStack align="stretch" gap={0} pl={4} bg={hoverBg}>
                                  {cat.children.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/categories/${sub.slug}`}
                                      onClick={() => setCategoryMenuOpen(false)}
                                    >
                                      <Box p={2} _hover={{ bg: activeBg }}>
                                        <Text fontSize="xs" color={mutedClr}>
                                          {sub.nameAr || sub.name}
                                        </Text>
                                      </Box>
                                    </Link>
                                  ))}
                                </VStack>
                              )}
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  )}
                </Box>

                <Link href="/categories">
                  <Text color={textClr} _hover={{ textDecoration: 'underline' }}>
                    كل الفئات
                  </Text>
                </Link>
                <Link href="/products">
                  <Text color={textClr} _hover={{ textDecoration: 'underline' }}>
                    المنتجات
                  </Text>
                </Link>
                <Link href="/small-business">
                  <Text color="green.600" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    أعمال صغيرة
                  </Text>
                </Link>
                <Link href="/ses-live">
                  <Text color="red.500" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                    🔴 SES Live
                  </Text>
                </Link>
                <Link href="/sellers">
                  <Text color={textClr} _hover={{ textDecoration: 'underline' }}>
                    🏬 المتاجر
                  </Text>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleColorMode}
                  color={textClr}
                  fontWeight="medium"
                >
                  <Text fontSize="sm">{colorMode === 'light' ? '🌙 ليلي' : '☀️ نهاري'}</Text>
                </Button>
              </HStack>

              {/* Icons + Auth */}
              <HStack gap={2}>
                {/* Saved / Wishlist (unified) */}
                <Link href="/saved">
                  <Button
                    variant="ghost"
                    size="sm"
                    position="relative"
                    aria-label="المحفوظات"
                  >
                    <Text fontSize="lg">♡</Text>
                    {(savedItems.length + wishlistItems.length) > 0 && (
                      <Box
                        position="absolute"
                        top="-1"
                        right="-1"
                        bg={btnBg}
                        color={btnClr}
                        fontSize="xs"
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {savedItems.length + wishlistItems.length}
                      </Box>
                    )}
                  </Button>
                </Link>

                {/* Cart */}
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    size="sm"
                    position="relative"
                    aria-label="سلة التسوق"
                  >
                    <Text fontSize="lg">السلة</Text>
                    {cartItems.length > 0 && (
                      <Box
                        position="absolute"
                        top="-1"
                        right="-1"
                        bg={btnBg}
                        color={btnClr}
                        fontSize="xs"
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {cartItems.length}
                      </Box>
                    )}
                  </Button>
                </Link>

                {/* Compare */}
                <Link href="/compare">
                  <Button
                    variant="ghost"
                    size="sm"
                    position="relative"
                    aria-label="المقارنة"
                  >
                    <Text fontSize="lg">⚖</Text>
                    {compareItems.length > 0 && (
                      <Box
                        position="absolute"
                        top="-1"
                        right="-1"
                        bg={btnBg}
                        color={btnClr}
                        fontSize="xs"
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {compareItems.length}
                      </Box>
                    )}
                  </Button>
                </Link>

                {/* Notifications */}
                {session && (
                  <Box ref={notificationsRef} position="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      position="relative"
                      aria-label="الإشعارات"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Text fontSize="lg">🔔</Text>
                      {unreadCount > 0 && (
                        <Box
                          position="absolute"
                          top="-1"
                          right="-1"
                          bg="red.500"
                          color="white"
                          fontSize="xs"
                          w="18px"
                          h="18px"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Box>
                      )}
                    </Button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <Box
                        position="absolute"
                        top="100%"
                        left={{ base: 'auto', md: 0 }}
                        right={{ base: 0, md: 'auto' }}
                        w={{ base: '300px', md: '350px' }}
                        bg={navBg}
                        borderWidth={2}
                        borderColor={borderClr}
                        borderRadius="lg"
                        boxShadow={shadowBox}
                        zIndex={300}
                        maxH="400px"
                        overflowY="auto"
                      >
                        <HStack justify="space-between" p={3} borderBottomWidth={1} borderColor={subBorder}>
                          <Text fontWeight="bold">الإشعارات</Text>
                          {unreadCount > 0 && (
                            <Button size="xs" variant="ghost" onClick={markAllRead}>
                              قراءة الكل
                            </Button>
                          )}
                        </HStack>
                        
                        {notifications.length === 0 ? (
                          <Box p={4} textAlign="center">
                            <Text color={mutedClr}>لا توجد إشعارات</Text>
                          </Box>
                        ) : (
                          <VStack align="stretch" gap={0}>
                            {notifications.map((notification) => (
                              <Box
                                key={notification.id}
                                p={3}
                                cursor="pointer"
                                bg={notification.read ? navBg : accentBg}
                                _hover={{ bg: activeBg }}
                                onClick={() => handleNotificationClick(notification)}
                                borderBottomWidth={1}
                                borderColor={subBorder}
                              >
                                <VStack align="start" gap={1}>
                                  <HStack w="full" justify="space-between">
                                    <Text fontWeight="bold" fontSize="sm" color={textClr}>
                                      {notification.title}
                                    </Text>
                                    {!notification.read && (
                                      <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
                                    )}
                                  </HStack>
                                  <Text fontSize="xs" color={mutedClr} lineClamp={2}>
                                    {notification.message}
                                  </Text>
                                  <Text fontSize="xs" color={dimClr}>
                                    {new Date(notification.createdAt).toLocaleDateString('ar-SY')}
                                  </Text>
                                </VStack>
                              </Box>
                            ))}
                          </VStack>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Auth */}
                {status === 'loading' ? (
                  <Text color="gray.500">...</Text>
                ) : session ? (
                  <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
                    {session.user?.role === 'ADMIN' && (
                      <Link href="/admin">
                        <Button size="sm" variant="outline" borderColor={borderClr} color={textClr}>
                          لوحة المشرف
                        </Button>
                      </Link>
                    )}
                    {session.user?.role === 'SELLER' && (
                      <Link href="/seller">
                        <Button size="sm" variant="outline" borderColor={borderClr} color={textClr}>
                          لوحة البائع
                        </Button>
                      </Link>
                    )}
                    <Link href="/dashboard">
                      <Button size="sm" variant="outline" borderColor={borderClr} color={textClr}>
                        حسابي
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      bg={btnBg}
                      color={btnClr}
                      _hover={{ bg: btnHoverBg }}
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      خروج
                    </Button>
                  </HStack>
                ) : (
                  <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
                    <Link href="/auth/login">
                      <Button size="sm" variant="outline" borderColor={borderClr} color={textClr}>
                        دخول
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" bg={btnBg} color={btnClr} _hover={{ bg: btnHoverBg }}>
                        تسجيل
                      </Button>
                    </Link>
                  </HStack>
                )}
              </HStack>
            </HStack>

            {/* Search Bar */}
            <Box ref={searchRef} position="relative">
              <form onSubmit={handleSearch}>
                <HStack>
                  <Input
                    value={localQuery}
                    onChange={(e) => {
                      setLocalQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="ابحث عن أي شيء..."
                    size={{ base: 'md', md: 'lg' }}
                    borderWidth={2}
                    borderColor={borderClr}
                    color={textClr}
                    _focus={{ boxShadow: focusShadow }}
                    flex={1}
                  />
                  <Button
                    type="submit"
                    size={{ base: 'md', md: 'lg' }}
                    bg={btnBg}
                    color={btnClr}
                    _hover={{ bg: btnHoverBg }}
                    px={{ base: 4, md: 8 }}
                  >
                    بحث
                  </Button>
                  <Button
                    type="button"
                    size={{ base: 'md', md: 'lg' }}
                    variant="outline"
                    borderColor={borderClr}
                    color={textClr}
                    _hover={{ bg: activeBg }}
                    px={{ base: 3, md: 6 }}
                    onClick={() => {
                      toggleAdvanced();
                      if (localQuery.trim()) {
                        router.push(`/products?q=${encodeURIComponent(localQuery.trim())}&advanced=true`);
                      } else {
                        router.push('/products?advanced=true');
                      }
                    }}
                  >
                    بحث متقدم
                  </Button>
                  <Button
                    type="button"
                    size={{ base: 'md', md: 'lg' }}
                    bg={btnBg}
                    color={btnClr}
                    _hover={{ bg: btnHoverBg }}
                    px={{ base: 3, md: 6 }}
                    onClick={handleSmartSearch}
                    disabled={!localQuery.trim() || smartSearchLoading}
                    display={{ base: 'none', md: 'flex' }}
                  >
                    {smartSearchLoading ? <Spinner size="sm" /> : 'بحث ذكي'}
                  </Button>
                </HStack>
              </form>

              {/* Autocomplete Suggestions */}
              {showSuggestions && (localQuery.length >= 2 || suggestions.length > 0) && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  bg={navBg}
                  borderWidth={2}
                  borderColor={borderClr}
                  borderTop={0}
                  borderRadius="0 0 lg lg"
                  boxShadow={shadowBox}
                  zIndex={200}
                  maxH="300px"
                  overflowY="auto"
                >
                  {isSearching ? (
                    <HStack p={4} justify="center">
                      <Spinner size="sm" color={textClr} />
                      <Text color={mutedClr}>جاري البحث...</Text>
                    </HStack>
                  ) : suggestions.length > 0 ? (
                    <VStack align="stretch" gap={0}>
                      {suggestions.map((item) => (
                        <Box
                          key={item.id}
                          p={3}
                          cursor="pointer"
                          _hover={{ bg: activeBg }}
                          onClick={() => handleSuggestionClick(item)}
                          borderBottomWidth={1}
                          borderColor={subBorder}
                        >
                          <HStack>
                            {item.image && (
                              <Box w="40px" h="40px" bg={hoverBg} borderRadius="md" overflow="hidden" position="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </Box>
                            )}
                            <Text color={textClr}>{item.title}</Text>
                          </HStack>
                        </Box>
                      ))}
                      <Box
                        p={3}
                        cursor="pointer"
                        bg={hoverBg}
                        _hover={{ bg: activeBg }}
                        onClick={handleSearch as any}
                        textAlign="center"
                      >
                        <Text color={textClr} fontWeight="medium">
                          عرض كل النتائج لـ &ldquo;{localQuery}&rdquo;
                        </Text>
                      </Box>
                    </VStack>
                  ) : localQuery.length >= 2 ? (
                    <Box p={4} textAlign="center">
                      <Text color={mutedClr}>لا توجد نتائج</Text>
                    </Box>
                  ) : null}
                </Box>
              )}
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={150}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Box
            position="absolute"
            top="0"
            right="0"
            w="280px"
            h="100%"
            bg={navBg}
            borderLeftWidth={2}
            borderColor={borderClr}
            onClick={(e) => e.stopPropagation()}
          >
            <VStack align="stretch" p={4} gap={4}>
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">القائمة</Text>
                <Button variant="ghost" onClick={() => setMobileMenuOpen(false)}>X</Button>
              </HStack>

              <VStack align="stretch" gap={2}>
                <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <Text color={textClr}>المنتجات</Text>
                  </Box>
                </Link>
                <Link href="/categories" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <Text color={textClr}>كل الفئات</Text>
                  </Box>
                </Link>
                <Link href="/products?advanced=true" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <Text color={textClr}>بحث متقدم</Text>
                  </Box>
                </Link>
                <Link href="/small-business" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <Text color="green.600" fontWeight="bold">أعمال صغيرة</Text>
                  </Box>
                </Link>
                <Link href="/ses-live" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <Text color="red.500" fontWeight="bold">🔴 SES Live</Text>
                  </Box>
                </Link>
                <Link href="/sellers" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <Text color={textClr}>🏬 المتاجر</Text>
                  </Box>
                </Link>
                <Link href="/saved" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <HStack justify="space-between">
                      <Text color={textClr}>♡ المحفوظات</Text>
                      {(savedItems.length + wishlistItems.length) > 0 && (
                        <Text bg={btnBg} color={btnClr} px={2} borderRadius="full" fontSize="sm">
                          {savedItems.length + wishlistItems.length}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Link>
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <HStack justify="space-between">
                      <Text color={textClr}>السلة</Text>
                      {cartItems.length > 0 && (
                        <Text bg={btnBg} color={btnClr} px={2} borderRadius="full" fontSize="sm">
                          {cartItems.length}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Link>
                <Link href="/compare" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: activeBg }} borderRadius="md">
                    <HStack justify="space-between">
                      <Text color={textClr}>⚖ المقارنة</Text>
                      {compareItems.length > 0 && (
                        <Text bg={btnBg} color={btnClr} px={2} borderRadius="full" fontSize="sm">
                          {compareItems.length}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Link>
              </VStack>

              <Box borderTopWidth={1} borderColor={subBorder} pt={4}>
                {session ? (
                  <VStack align="stretch" gap={2}>
                    {session.user?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button w="full" variant="outline" borderColor={borderClr} color={textClr}>لوحة المشرف</Button>
                      </Link>
                    )}
                    {session.user?.role === 'SELLER' && (
                      <Link href="/seller" onClick={() => setMobileMenuOpen(false)}>
                        <Button w="full" variant="outline" borderColor={borderClr} color={textClr}>لوحة البائع</Button>
                      </Link>
                    )}
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button w="full" variant="outline" borderColor={borderClr} color={textClr}>حسابي</Button>
                    </Link>
                    <Button
                      w="full"
                      bg={btnBg}
                      color={btnClr}
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      خروج
                    </Button>
                  </VStack>
                ) : (
                  <VStack align="stretch" gap={2}>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button w="full" variant="outline" borderColor={borderClr} color={textClr}>دخول</Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button w="full" bg={btnBg} color={btnClr}>تسجيل</Button>
                    </Link>
                  </VStack>
                )}
                <Button
                  w="full"
                  mt={3}
                  variant="outline"
                  borderColor={borderClr}
                  color={textClr}
                  onClick={toggleColorMode}
                >
                  {colorMode === 'light' ? '🌙 ليلي' : '☀️ نهاري'}
                </Button>
              </Box>
            </VStack>
          </Box>
        </Box>
      )}
    </>
  );
}
