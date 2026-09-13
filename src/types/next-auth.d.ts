import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'admin' | 'member'
      /** Sign-in instant (ms). 0 for tokens issued before this field existed. */
      authAt: number
    } & DefaultSession['user']
  }

  interface User {
    role: 'admin' | 'member'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'admin' | 'member'
    authAt?: number
  }
}
