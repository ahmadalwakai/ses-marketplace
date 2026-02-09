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
import { useWishlistStore, useCompareStore, useUIStore, useSearchStore } from '@/lib/store';

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
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { query, setQuery, suggestions, setSuggestions, isSearching, setIsSearching, clearSuggestions } = useSearchStore();
  
  const [localQuery, setLocalQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsSearching(true);
      fetch(`/api/search?mode=autocomplete&q=${encodeURIComponent(debouncedQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSuggestions(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    } else {
      clearSuggestions();
    }
  }, [debouncedQuery, setSuggestions, clearSuggestions, setIsSearching]);

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

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setLocalQuery('');
    router.push(`/products/${slug}`);
  };

  return (
    <>
      <Box
        as="nav"
        bg="white"
        borderBottomWidth={2}
        borderColor="black"
        position="sticky"
        top={0}
        zIndex={100}
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
                <Text fontSize="xl">{mobileMenuOpen ? '✕' : '☰'}</Text>
              </Button>

              {/* Logo */}
              <Link href="/">
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="black">
                  SES سوريا
                </Text>
              </Link>

              {/* Desktop Nav Links */}
              <HStack gap={4} display={{ base: 'none', md: 'flex' }}>
                <Link href="/products">
                  <Text color="black" _hover={{ textDecoration: 'underline' }}>
                    المنتجات
                  </Text>
                </Link>
                <Link href="/categories">
                  <Text color="black" _hover={{ textDecoration: 'underline' }}>
                    الفئات
                  </Text>
                </Link>
              </HStack>

              {/* Icons + Auth */}
              <HStack gap={2}>
                {/* Wishlist */}
                <Link href="/wishlist">
                  <Button
                    variant="ghost"
                    size="sm"
                    position="relative"
                    aria-label="المفضلة"
                  >
                    <Text fontSize="lg">♡</Text>
                    {wishlistItems.length > 0 && (
                      <Box
                        position="absolute"
                        top="-1"
                        right="-1"
                        bg="black"
                        color="white"
                        fontSize="xs"
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {wishlistItems.length}
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
                        bg="black"
                        color="white"
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

                {/* Auth */}
                {status === 'loading' ? (
                  <Text color="gray.500">...</Text>
                ) : session ? (
                  <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
                    {session.user?.role === 'ADMIN' && (
                      <Link href="/admin">
                        <Button size="sm" variant="outline" borderColor="black" color="black">
                          لوحة المشرف
                        </Button>
                      </Link>
                    )}
                    {session.user?.role === 'SELLER' && (
                      <Link href="/seller">
                        <Button size="sm" variant="outline" borderColor="black" color="black">
                          لوحة البائع
                        </Button>
                      </Link>
                    )}
                    <Link href="/dashboard">
                      <Button size="sm" variant="outline" borderColor="black" color="black">
                        حسابي
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      bg="black"
                      color="white"
                      _hover={{ bg: 'gray.800' }}
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      خروج
                    </Button>
                  </HStack>
                ) : (
                  <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
                    <Link href="/auth/login">
                      <Button size="sm" variant="outline" borderColor="black" color="black">
                        دخول
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" bg="black" color="white" _hover={{ bg: 'gray.800' }}>
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
                    placeholder="ابحث عن منتج..."
                    size={{ base: 'md', md: 'lg' }}
                    borderWidth={2}
                    borderColor="black"
                    _focus={{ boxShadow: '2px 2px 0 0 black' }}
                    flex={1}
                  />
                  <Button
                    type="submit"
                    size={{ base: 'md', md: 'lg' }}
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    px={{ base: 4, md: 8 }}
                  >
                    بحث
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
                  bg="white"
                  borderWidth={2}
                  borderColor="black"
                  borderTop={0}
                  borderRadius="0 0 lg lg"
                  boxShadow="4px 4px 0 0 black"
                  zIndex={200}
                  maxH="300px"
                  overflowY="auto"
                >
                  {isSearching ? (
                    <HStack p={4} justify="center">
                      <Spinner size="sm" color="black" />
                      <Text color="gray.600">جاري البحث...</Text>
                    </HStack>
                  ) : suggestions.length > 0 ? (
                    <VStack align="stretch" gap={0}>
                      {suggestions.map((item) => (
                        <Box
                          key={item.id}
                          p={3}
                          cursor="pointer"
                          _hover={{ bg: 'gray.100' }}
                          onClick={() => handleSuggestionClick(item.slug)}
                          borderBottomWidth={1}
                          borderColor="gray.200"
                        >
                          <HStack>
                            {item.image && (
                              <Box w="40px" h="40px" bg="gray.100" borderRadius="md" overflow="hidden">
                                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </Box>
                            )}
                            <Text color="black">{item.title}</Text>
                          </HStack>
                        </Box>
                      ))}
                      <Box
                        p={3}
                        cursor="pointer"
                        bg="gray.50"
                        _hover={{ bg: 'gray.100' }}
                        onClick={handleSearch as any}
                        textAlign="center"
                      >
                        <Text color="black" fontWeight="medium">
                          عرض كل النتائج لـ "{localQuery}"
                        </Text>
                      </Box>
                    </VStack>
                  ) : localQuery.length >= 2 ? (
                    <Box p={4} textAlign="center">
                      <Text color="gray.600">لا توجد نتائج</Text>
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
            bg="white"
            borderLeftWidth={2}
            borderColor="black"
            onClick={(e) => e.stopPropagation()}
          >
            <VStack align="stretch" p={4} gap={4}>
              <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">القائمة</Text>
                <Button variant="ghost" onClick={() => setMobileMenuOpen(false)}>✕</Button>
              </HStack>

              <VStack align="stretch" gap={2}>
                <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: 'gray.100' }} borderRadius="md">
                    <Text>المنتجات</Text>
                  </Box>
                </Link>
                <Link href="/categories" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: 'gray.100' }} borderRadius="md">
                    <Text>الفئات</Text>
                  </Box>
                </Link>
                <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: 'gray.100' }} borderRadius="md">
                    <HStack justify="space-between">
                      <Text>المفضلة</Text>
                      {wishlistItems.length > 0 && (
                        <Text bg="black" color="white" px={2} borderRadius="full" fontSize="sm">
                          {wishlistItems.length}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Link>
                <Link href="/compare" onClick={() => setMobileMenuOpen(false)}>
                  <Box p={3} _hover={{ bg: 'gray.100' }} borderRadius="md">
                    <HStack justify="space-between">
                      <Text>المقارنة</Text>
                      {compareItems.length > 0 && (
                        <Text bg="black" color="white" px={2} borderRadius="full" fontSize="sm">
                          {compareItems.length}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Link>
              </VStack>

              <Box borderTopWidth={1} borderColor="gray.200" pt={4}>
                {session ? (
                  <VStack align="stretch" gap={2}>
                    {session.user?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button w="full" variant="outline" borderColor="black">لوحة المشرف</Button>
                      </Link>
                    )}
                    {session.user?.role === 'SELLER' && (
                      <Link href="/seller" onClick={() => setMobileMenuOpen(false)}>
                        <Button w="full" variant="outline" borderColor="black">لوحة البائع</Button>
                      </Link>
                    )}
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button w="full" variant="outline" borderColor="black">حسابي</Button>
                    </Link>
                    <Button
                      w="full"
                      bg="black"
                      color="white"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      خروج
                    </Button>
                  </VStack>
                ) : (
                  <VStack align="stretch" gap={2}>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button w="full" variant="outline" borderColor="black">دخول</Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button w="full" bg="black" color="white">تسجيل</Button>
                    </Link>
                  </VStack>
                )}
              </Box>
            </VStack>
          </Box>
        </Box>
      )}
    </>
  );
}
