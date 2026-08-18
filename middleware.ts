import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*'],
}
