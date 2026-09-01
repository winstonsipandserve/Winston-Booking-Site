import { auth } from '../../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { resolveAdminCheckInResult } from '@/lib/admin-check-in'
import { checkCheckInRateLimit, recordFailedCheckInAttempt } from '@/lib/check-in-rate-limit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limited, retryAfterSeconds } = await checkCheckInRateLimit(session.user.id)
  if (limited) {
    return Response.json(
      { error: 'Too many attempts. Please wait before trying again.', retryAfterSeconds },
      { status: 429 },
    )
  }

  const { code } = await params

  try {
    const customer = await prisma.customer.findUnique({ where: { checkInCode: code } })
    if (!customer) {
      await recordFailedCheckInAttempt(session.user.id)
      return Response.json({ error: 'Code not recognized' }, { status: 404 })
    }

    const result = await resolveAdminCheckInResult(customer)
    return Response.json(result, { status: 200 })
  } catch (err) {
    console.error('Failed to verify check-in code', err)
    return Response.json({ error: 'Unable to verify code' }, { status: 500 })
  }
}
