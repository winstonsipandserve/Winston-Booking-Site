import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/admin-auth'
import { consumeAuthRateLimitAttempt } from '@/lib/auth-rate-limit'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        if (!(await consumeAuthRateLimitAttempt('admin_login', request, email))) {
          return null
        }

        const adminUser = await prisma.adminUser.findUnique({ where: { email } })
        if (!adminUser || !adminUser.isActive) {
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
      authorize: async (credentials, request) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        if (!(await consumeAuthRateLimitAttempt('member_login', request, email))) {
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
})
