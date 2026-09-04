import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { resolveAdminCheckInResult } from '@/lib/admin-check-in'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params

  try {
    const customer = await prisma.customer.findUnique({ where: { checkInToken: token } })
    if (!customer) {
      return Response.json({ error: 'Code not recognized' }, { status: 404 })
    }

    const result = await resolveAdminCheckInResult(customer)
    return Response.json(result, { status: 200 })
  } catch (err) {
    console.error('Failed to verify check-in token', err)
    return Response.json({ error: 'Unable to verify code' }, { status: 500 })
  }
}
