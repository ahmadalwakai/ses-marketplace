import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendWelcomeEmailWithRole } from '@/lib/email/resend';
import type { Role, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: Role;
      status: UserStatus;
      image?: string | null;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    status: UserStatus;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

// eslint-disable-next-line
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const email = credentials.email as string;
        const password = credentials.password as string;
        
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        
        if (!user || !user.password) {
          return null;
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }
        
        if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
    // Google OAuth - configured via environment variables
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth sign-in (Google), handle user creation/validation and account linking
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          include: { accounts: true },
        });
        
        // Block banned/suspended users
        if (existingUser && (existingUser.status === 'BANNED' || existingUser.status === 'SUSPENDED')) {
          return false;
        }
        
        // If user doesn't exist, create them as CUSTOMER with ACTIVE status
        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name || profile?.name || 'مستخدم',
              image: user.image || null,
              emailVerified: new Date(),
              role: 'CUSTOMER',
              status: 'ACTIVE',
            },
          });
          
          // Update the user object with the new user's id
          user.id = newUser.id;
          user.role = newUser.role;
          user.status = newUser.status;
          
          // Send welcome email for new Google signup
          sendWelcomeEmailWithRole(newUser.email, newUser.name || 'مستخدم', 'CUSTOMER').catch(console.error);
        } else {
          // Check if Google account is already linked
          const googleAccountLinked = existingUser.accounts.some(
            (acc) => acc.provider === 'google'
          );
          
          // If not linked, link the Google account to existing user
          if (!googleAccountLinked && account.providerAccountId) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }
          
          // Update user image from Google if not set
          if (!existingUser.image && user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image: user.image },
            });
          }
          
          // Set the user object properties from existing user
          user.id = existingUser.id;
          user.role = existingUser.role;
          user.status = existingUser.status;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session, account }) {
      // On initial sign-in, set token data from user
      if (user) {
        token.id = user.id!;
        // For OAuth users, we set role/status in signIn callback
        if (user.role) {
          token.role = user.role;
          token.status = user.status;
        } else {
          // Fetch from DB for credentials users
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id! },
            select: { role: true, status: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        }
      }
      
      // Update token on session update
      if (trigger === 'update' && session && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
  trustHost: true,
});

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
