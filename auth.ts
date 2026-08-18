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
  ],
})
