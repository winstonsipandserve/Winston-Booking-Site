import type { MemberActivationToken } from '@prisma/client'
import { prisma } from '@/lib/prisma'
// hashPassword is generic (not admin-specific) despite the file's name — reused here for members.
import { hashPassword } from '@/lib/admin-auth'
import { hashActivationToken } from '@/lib/member-activation'

interface ActivateRequestBody {
  token?: unknown
  password?: unknown
  confirmPassword?: unknown
}

type TokenLookupResult =
  | { ok: true; activationToken: MemberActivationToken }
  | { ok: false; error: string; status: number }

/** Shared by GET (pre-check, no mutation) and POST (consumes the token) so both agree on
 * what counts as invalid/used/expired. */
async function lookupActivationToken(token: string): Promise<TokenLookupResult> {
  const tokenHash = hashActivationToken(token)
  const activationToken = await prisma.memberActivationToken.findUnique({
    where: { tokenHash },
  })

  if (!activationToken) {
    return { ok: false, error: 'Invalid activation link', status: 404 }
  }
  if (activationToken.usedAt) {
    return { ok: false, error: 'This activation link has already been used', status: 400 }
  }
  if (activationToken.expiresAt < new Date()) {
    return { ok: false, error: 'This activation link has expired', status: 400 }
  }
  return { ok: true, activationToken }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) {
    return Response.json({ error: 'A token is required' }, { status: 400 })
  }

  const result = await lookupActivationToken(token)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json({ valid: true }, { status: 200 })
}

export async function POST(request: Request) {
  let body: ActivateRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { token, password, confirmPassword } = body

  if (typeof token !== 'string' || token.length === 0) {
    return Response.json({ error: 'A token is required' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length === 0) {
    return Response.json({ error: 'A password is required' }, { status: 400 })
  }
  if (typeof confirmPassword !== 'string' || confirmPassword.length === 0) {
    return Response.json({ error: 'Please confirm your password' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (password !== confirmPassword) {
    return Response.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  const result = await lookupActivationToken(token)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  const { activationToken } = result

  const passwordHash = await hashPassword(password)

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: activationToken.customerId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.memberActivationToken.update({
      where: { id: activationToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return Response.json({ success: true }, { status: 200 })
}
