import { prisma } from '@/lib/prisma'
import { auth } from '../../../../../../auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'member') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { membership: true },
  })

  if (!payment || !payment.membershipId || payment.membership?.customerId !== session.user.id) {
    return Response.json({ error: 'Payment not found' }, { status: 404 })
  }

  const hasCompleted = payment.status === 'paid'

  return Response.json(
    {
      id: payment.id,
      status: payment.status,
      amountCentavos: payment.amountCentavos,
      hasCompleted,
      newBalanceCentavos: hasCompleted ? payment.membership?.creditBalanceCentavos ?? null : null,
    },
    { status: 200 },
  )
}
