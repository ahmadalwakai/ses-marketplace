'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Box,
  Container,
  HStack,
  Button,
  Text,
  Menu,
  Portal,
} from '@chakra-ui/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <Box
      as="nav"
      bg="white"
      borderBottomWidth={2}
      borderColor="black"
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Container maxW="7xl" py={4}>
        <HStack justify="space-between">
          {/* Logo */}
          <Link href="/">
            <Text fontSize="xl" fontWeight="bold" color="black">
              SES سوريا
            </Text>
          </Link>

          {/* Nav Links */}
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

          {/* Auth */}
          <HStack gap={2}>
            {status === 'loading' ? (
              <Text color="gray.500">...</Text>
            ) : session ? (
              <>
                {/* Dashboard Link based on role */}
                {session.user?.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="black"
                      color="black"
                    >
                      لوحة المشرف
                    </Button>
                  </Link>
                )}
                {session.user?.role === 'SELLER' && (
                  <Link href="/seller">
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="black"
                      color="black"
                    >
                      لوحة البائع
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="black"
                    color="black"
                  >
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
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="black"
                    color="black"
                  >
                    دخول
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                  >
                    تسجيل
                  </Button>
                </Link>
              </>
            )}
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
