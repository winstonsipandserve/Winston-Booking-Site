import crypto from 'crypto'

const BOOKING_ACCESS_COOKIE_PREFIX = 'winston_booking_access_'
const BOOKING_ACCESS_TTL_SECONDS = 24 * 60 * 60

export function createBookingAccessToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashBookingAccessToken(rawToken)
  const expiresAt = new Date(Date.now() + BOOKING_ACCESS_TTL_SECONDS * 1000)
  return { rawToken, tokenHash, expiresAt }
}

export function hashBookingAccessToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function getBookingAccessCookieName(bookingId: string): string {
  return `${BOOKING_ACCESS_COOKIE_PREFIX}${bookingId}`
}

export function hasValidBookingAccessToken(
  request: Request,
  booking: { id: string; accessTokenHash: string | null; accessTokenExpiresAt: Date | null },
): boolean {
  if (!booking.accessTokenHash || !booking.accessTokenExpiresAt || booking.accessTokenExpiresAt < new Date()) {
    return false
  }

  const token = readCookie(request.headers.get('cookie'), getBookingAccessCookieName(booking.id))
  if (!token) return false

  const expected = Buffer.from(booking.accessTokenHash, 'hex')
  const actual = Buffer.from(hashBookingAccessToken(token), 'hex')
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

export function appendBookingAccessCookie(response: Response, bookingId: string, rawToken: string): Response {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.headers.append(
    'Set-Cookie',
    `${getBookingAccessCookieName(bookingId)}=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${BOOKING_ACCESS_TTL_SECONDS}${secure}`,
  )
  return response
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return value.join('=') || null
  }
  return null
}
