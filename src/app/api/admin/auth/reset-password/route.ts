import type { AdminPasswordResetToken } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/admin-auth'
import { hashPasswordResetToken } from '@/lib/password-reset'

interface ResetPasswordRequestBody {
  token?: unknown
  password?: unknown
  confirmPassword?: unknown
}

type TokenLookupResult =
  | { ok: true; resetToken: AdminPasswordResetToken }
  | { ok: false; error: string; status: number }

/** Shared by GET (pre-check, no mutation) and POST (consumes the token) so both agree on
 * what counts as invalid/used/expired. */
async function lookupResetToken(token: string): Promise<TokenLookupResult> {
  const tokenHash = hashPasswordResetToken(token)
  const resetToken = await prisma.adminPasswordResetToken.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  })

  if (!resetToken || !resetToken.adminUser.isActive) {
    return { ok: false, error: 'Invalid or expired reset link', status: 404 }
  }
  if (resetToken.usedAt) {
    return { ok: false, error: 'This reset link has already been used', status: 400 }
  }
  if (resetToken.expiresAt < new Date()) {
    return { ok: false, error: 'This reset link has expired', status: 400 }
  }
  return { ok: true, resetToken }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) {
    return Response.json({ error: 'A token is required' }, { status: 400 })
  }

  const result = await lookupResetToken(token)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  return Response.json({ valid: true }, { status: 200 })
}

export async function POST(request: Request) {
  let body: ResetPasswordRequestBody
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

  const result = await lookupResetToken(token)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }
  const { resetToken } = result

  const passwordHash = await hashPassword(password)
  const consumedAt = new Date()

  const consumed = await prisma.$transaction(async (tx) => {
    // The conditional update is the atomic single-use check: exactly one concurrent
    // request can consume the token, and expiry is rechecked at the write boundary.
    const markedUsed = await tx.adminPasswordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gte: consumedAt } },
      data: { usedAt: consumedAt },
    })
    if (markedUsed.count !== 1) return false

    await tx.adminUser.update({
      where: { id: resetToken.adminUserId },
      data: { passwordHash, passwordChangedAt: consumedAt },
    })
    await tx.adminPasswordResetToken.updateMany({
      where: { adminUserId: resetToken.adminUserId, usedAt: null },
      data: { usedAt: consumedAt },
    })
    return true
  })

  if (!consumed) {
    return Response.json({ error: 'Invalid or expired reset link' }, { status: 404 })
  }

  return Response.json({ success: true }, { status: 200 })
}
