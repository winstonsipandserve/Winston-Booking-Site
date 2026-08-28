import { prisma } from '@/lib/prisma'
import { formatMembershipTier } from '@/lib/format'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { membership: true },
    relationLoadStrategy: 'query',
  })

  if (!application) {
    return Response.json({ error: 'Application not found' }, { status: 404 })
  }

  return Response.json(
    {
      id: application.id,
      status: application.status,
      tierName: formatMembershipTier(application.requestedTier),
      hasMembership: Boolean(application.membership),
    },
    { status: 200 },
  )
}
