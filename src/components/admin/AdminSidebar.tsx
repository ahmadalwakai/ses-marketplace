'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
} from '@chakra-ui/react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', href: '/admin', icon: '📊' },
  { label: 'الطلبات', href: '/admin/orders', icon: '📦' },
  { label: 'المنتجات', href: '/admin/products', icon: '🛍️' },
  { label: 'التصنيفات', href: '/admin/categories', icon: '📂' },
  { label: 'البائعون', href: '/admin/sellers', icon: '🏪' },
  { label: 'المستخدمون', href: '/admin/users', icon: '👥' },
  { label: 'المشرفون', href: '/admin/admins', icon: '🛡️' },
  { label: 'القسائم', href: '/admin/vouchers', icon: '🎁' },
  { label: 'الإعدادات', href: '/admin/settings', icon: '⚙️' },
  { label: 'سجل المراجعة', href: '/admin/audit', icon: '📋' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <VStack gap={1} align="stretch" flex={1}>
      {/* Brand */}
      <Box px={4} py={4} borderBottomWidth="1px" borderColor="gray.200">
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <Heading size="md" color="blue.600">SES Admin</Heading>
        </Link>
        <Text fontSize="xs" color="gray.500" mt={1}>لوحة الإدارة</Text>
      </Box>

      {/* Nav links */}
      <VStack gap={0.5} align="stretch" px={2} py={3} flex={1}>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
              <HStack
                px={3}
                py={2.5}
                borderRadius="md"
                bg={active ? 'blue.50' : 'transparent'}
                color={active ? 'blue.700' : 'gray.700'}
                fontWeight={active ? 'bold' : 'normal'}
                _hover={{ bg: active ? 'blue.100' : 'gray.100' }}
                transition="all 0.15s"
              >
                <Text fontSize="lg">{item.icon}</Text>
                <Text fontSize="sm">{item.label}</Text>
              </HStack>
            </Link>
          );
        })}
      </VStack>

      {/* User section */}
      <Box px={4} py={3} borderTopWidth="1px" borderColor="gray.200">
        <Text fontSize="xs" color="gray.500" mb={1}>
          {session?.user?.email ?? ''}
        </Text>
        <HStack gap={2}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button size="xs" variant="outline" colorScheme="gray">
              الموقع
            </Button>
          </Link>
          <Button size="xs" variant="outline" colorScheme="red" onClick={() => signOut({ callbackUrl: '/' })}>
            خروج
          </Button>
        </HStack>
      </Box>
    </VStack>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top={2}
        right={2}
        zIndex={1100}
      >
        <Button
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          colorScheme="blue"
        >
          {mobileOpen ? '✕' : '☰'}
        </Button>
      </Box>

      {/* Mobile overlay */}
      {mobileOpen && (
        <Box
          display={{ base: 'block', md: 'none' }}
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={1000}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Box
        as="nav"
        position="fixed"
        top={0}
        right={0}
        h="100vh"
        w="240px"
        bg="white"
        borderLeftWidth="1px"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        overflowY="auto"
        zIndex={1050}
        transform={{
          base: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          md: 'translateX(0)',
        }}
        transition="transform 0.2s"
      >
        {sidebarContent}
      </Box>
    </>
  );
}
