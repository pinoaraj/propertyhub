import NextAuth, { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/onboarding',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    // Microsoft OAuth disabled for now - add credentials to enable
    // MicrosoftEntraID({
    //   clientId: process.env.MICROSOFT_CLIENT_ID,
    //   clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    //   tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    //   authorization: {
    //     params: {
    //       scope: 'openid email profile offline_access Calendars.ReadWrite',
    //     },
    //   },
    // }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email, password } = await z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .parseAsync(credentials);

        // TODO: Implement password verification with bcrypt
        // const user = await prisma.user.findUnique({ where: { email } });
        // if (!user || !user.password) return null;
        // const isValid = await bcrypt.compare(password, user.password);
        // if (!isValid) return null;

        return null; // Placeholder - implement password auth if needed
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'microsoft-entra-id') {
        // Store the calendar tokens in ConnectedAccount
        if (account.access_token && account.refresh_token) {
          await prisma.connectedAccount.upsert({
            where: {
              userId_provider: {
                userId: user.id!,
                provider: account.provider === 'google' ? 'GOOGLE' : 'MICROSOFT',
              },
            },
            update: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
              calendarId: 'primary',
              scopes: account.scope?.split(' ') || [],
              isActive: true,
              lastSyncAt: new Date(),
            },
            create: {
              userId: user.id!,
              provider: account.provider === 'google' ? 'GOOGLE' : 'MICROSOFT',
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
              calendarId: 'primary',
              scopes: account.scope?.split(' ') || [],
              isActive: true,
              lastSyncAt: new Date(),
            },
          });
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
      }
      return token;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      // Account linking handled in signIn callback
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);