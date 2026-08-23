import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/admin-auth'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const adminUser = await prisma.adminUser.findUnique({ where: { email } })
        if (!adminUser) {
          return null
        }

        const isValid = await verifyPassword(password, adminUser.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        }
      },
    }),
    Credentials({
      id: 'member-credentials',
      name: 'Member Credentials',
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const customer = await prisma.customer.findUnique({ where: { email } })
        if (!customer || !customer.passwordHash) {
          return null
        }

        const isValid = await verifyPassword(password, customer.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: 'member' as const,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'admin' | 'member'
      }
      return session
    },
  },
})
