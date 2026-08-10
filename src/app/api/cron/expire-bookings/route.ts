import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const HOLD_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES) || 10

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const holdCutoff = new Date(Date.now() - HOLD_MINUTES * 60000)
  const result = await prisma.booking.updateMany({
    where: {
      status: 'pending_payment',
      createdAt: { lt: holdCutoff },
    },
    data: { status: 'cancelled' },
  })

  return Response.json({ cancelledCount: result.count }, { status: 200 })
}
