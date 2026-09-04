import { prisma } from '@/lib/prisma'
import { generateAdminPasswordResetToken } from '@/lib/admin-password-reset'
import { sendAdminPasswordResetEmail } from '@/lib/resend'

interface ForgotPasswordRequestBody {
  email?: unknown
}

const GENERIC_RESPONSE = {
  message: "If that email is registered, we've sent a password reset link.",
}

export async function POST(request: Request) {
  let body: ForgotPasswordRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { email } = body

  if (typeof email !== 'string' || email.length === 0 || !email.includes('@')) {
    return Response.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const adminUser = await prisma.adminUser.findUnique({ where: { email } })

  if (adminUser && adminUser.isActive) {
    const { rawToken, tokenHash, expiresAt } = generateAdminPasswordResetToken()

    await prisma.adminPasswordResetToken.create({
      data: { adminUserId: adminUser.id, tokenHash, expiresAt },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${rawToken}`
    await sendAdminPasswordResetEmail({ to: adminUser.email, resetUrl })
  }

  return Response.json(GENERIC_RESPONSE, { status: 200 })
}
