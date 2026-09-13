import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        // Sign-in instant, compared against passwordChangedAt by the session helpers so a
        // password reset revokes every token issued before it.
        token.authAt = Date.now()
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'admin' | 'member'
        session.user.authAt = typeof token.authAt === 'number' ? token.authAt : 0
      }
      return session
    },
  },
} satisfies NextAuthConfig
