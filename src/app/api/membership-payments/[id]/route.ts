import { prisma } from '@/lib/prisma'
import { formatMembershipTier } from '@/lib/format'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const membershipPayment = await prisma.membershipPayment.findUnique({ where: { id } })
  if (!membershipPayment) {
    return Response.json({ error: 'Payment not found' }, { status: 404 })
  }

  return Response.json(
    {
      id: membershipPayment.id,
      status: membershipPayment.status,
      tierName: formatMembershipTier(membershipPayment.tier),
      hasMembership: membershipPayment.status === 'paid',
    },
    { status: 200 },
  )
}
