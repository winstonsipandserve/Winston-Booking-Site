import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

interface UpdatePricingRuleBody {
  priceCentavos?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.pricingRule.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Pricing rule not found' }, { status: 404 })
  }

  let body: UpdatePricingRuleBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { priceCentavos } = body
  if (!(typeof priceCentavos === 'number' && Number.isInteger(priceCentavos) && priceCentavos > 0)) {
    return Response.json({ error: 'priceCentavos must be a positive integer' }, { status: 400 })
  }

  const pricingRule = await prisma.pricingRule.update({
    where: { id },
    data: { priceCentavos },
  })

  return Response.json(pricingRule, { status: 200 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.pricingRule.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Pricing rule not found' }, { status: 404 })
  }

  await prisma.pricingRule.delete({ where: { id } })

  return Response.json({ success: true }, { status: 200 })
}
