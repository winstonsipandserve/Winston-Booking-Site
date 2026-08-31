import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { getLatestMembershipByCustomerId, buildMembershipDisplayFields } from '@/lib/membership-latest'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params

  try {
    const customer = await prisma.customer.findUnique({ where: { checkInToken: token } })
    if (!customer) {
      return Response.json({ error: 'Code not recognized' }, { status: 404 })
    }

    const latestMembership = await getLatestMembershipByCustomerId(customer.id)
    if (!latestMembership) {
      return Response.json({ found: true, hasMembership: false, name: customer.name }, { status: 200 })
    }

    const displayFields = await buildMembershipDisplayFields(latestMembership)

    return Response.json(
      {
        found: true,
        hasMembership: true,
        name: customer.name,
        email: customer.email,
        tierName: displayFields.tierName,
        isExpired: displayFields.isExpired,
        expiryDateLabel: displayFields.expiryDateLabel,
        remainingCreditCentavos: displayFields.remainingCreditCentavos,
        creditCentavos: displayFields.creditCentavos,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('Failed to verify check-in token', err)
    return Response.json({ error: 'Unable to verify code' }, { status: 500 })
  }
}
