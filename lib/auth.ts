import { type AuthConfig } from '@auth/core';
import { getToken } from '@auth/core/jwt';
import { cookies } from 'next/headers';
import Credentials from '@auth/core/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const authConfig: AuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: '/api/auth',
};

const NON_SECURE_COOKIE = 'authjs.session-token';
const SECURE_COOKIE = '__Secure-authjs.session-token';

export async function getAuthSession() {
  try {
    const cookieStore = await cookies();

    const secureCookie = cookieStore.get(SECURE_COOKIE);
    const nonSecureCookie = cookieStore.get(NON_SECURE_COOKIE);

    const sessionCookie = secureCookie || nonSecureCookie;
    if (!sessionCookie) return null;

    const cookieName = secureCookie ? SECURE_COOKIE : NON_SECURE_COOKIE;

    const decoded = await getToken({
      req: { headers: new Headers({ cookie: `${cookieName}=${sessionCookie.value}` }) },
      secret: process.env.AUTH_SECRET!,
      cookieName,
    });

    if (!decoded) return null;

    return {
      user: {
        id: decoded.sub as string,
        email: decoded.email as string | null | undefined,
        name: decoded.name as string | null | undefined,
      },
      expires: new Date((decoded.exp as number) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}
