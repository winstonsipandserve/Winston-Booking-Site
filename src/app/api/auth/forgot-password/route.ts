import { prisma } from '@/lib/prisma'
import { generatePasswordResetToken } from '@/lib/password-reset'
import { sendPasswordResetEmail } from '@/lib/resend'

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

  const customer = await prisma.customer.findUnique({ where: { email } })

  if (customer && customer.passwordHash) {
    const { rawToken, tokenHash, expiresAt } = generatePasswordResetToken()

    await prisma.passwordResetToken.create({
      data: { customerId: customer.id, tokenHash, expiresAt },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`
    await sendPasswordResetEmail({ to: customer.email, resetUrl })
  }

  return Response.json(GENERIC_RESPONSE, { status: 200 })
}
