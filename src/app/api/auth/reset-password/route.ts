import { prisma } from '@/lib/prisma'
// hashPassword is generic (not admin-specific) despite the file's name — reused here for members.
import { hashPassword } from '@/lib/admin-auth'
import { hashPasswordResetToken } from '@/lib/password-reset'

interface ResetPasswordRequestBody {
  token?: unknown
  password?: unknown
  confirmPassword?: unknown
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

  const tokenHash = hashPasswordResetToken(token)
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })

  if (!resetToken) {
    return Response.json({ error: 'Invalid or expired reset link' }, { status: 404 })
  }
  if (resetToken.usedAt) {
    return Response.json({ error: 'This reset link has already been used' }, { status: 400 })
  }
  if (resetToken.expiresAt < new Date()) {
    return Response.json({ error: 'This reset link has expired' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: resetToken.customerId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return Response.json({ success: true }, { status: 200 })
}
