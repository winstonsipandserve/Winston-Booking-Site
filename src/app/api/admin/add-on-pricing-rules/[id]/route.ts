import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

interface UpdateAddOnPricingRuleBody {
  priceCentavos?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.addOnPricingRule.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Add-on pricing rule not found' }, { status: 404 })
  }

  let body: UpdateAddOnPricingRuleBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { priceCentavos } = body
  if (!(typeof priceCentavos === 'number' && Number.isInteger(priceCentavos) && priceCentavos > 0)) {
    return Response.json({ error: 'priceCentavos must be a positive integer' }, { status: 400 })
  }

  const addOnPricingRule = await prisma.addOnPricingRule.update({
    where: { id },
    data: { priceCentavos },
  })

  return Response.json(addOnPricingRule, { status: 200 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.addOnPricingRule.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Add-on pricing rule not found' }, { status: 404 })
  }

  const usageCount = await prisma.bookingAddOn.count({ where: { addOnPricingRuleId: id } })
  if (usageCount > 0) {
    return Response.json(
      { error: 'This pricing rule has been used in past bookings and cannot be deleted' },
      { status: 409 },
    )
  }

  await prisma.addOnPricingRule.delete({ where: { id } })

  return Response.json({ success: true }, { status: 200 })
}
