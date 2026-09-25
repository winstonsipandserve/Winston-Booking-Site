import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { isValidPricingRuleCombo } from '@/lib/pricing-rule-combos'

interface CreatePricingRuleBody {
  resourceTypeId?: unknown
  durationMinutes?: unknown
  priceCentavos?: unknown
}

export async function POST(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreatePricingRuleBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { resourceTypeId, durationMinutes, priceCentavos } = body

  if (typeof resourceTypeId !== 'string' || resourceTypeId.trim() === '') {
    return Response.json({ error: 'resourceTypeId is required' }, { status: 400 })
  }
  if (!(typeof durationMinutes === 'number' && Number.isInteger(durationMinutes) && durationMinutes > 0)) {
    return Response.json({ error: 'durationMinutes must be a positive integer' }, { status: 400 })
  }
  if (!(typeof priceCentavos === 'number' && Number.isInteger(priceCentavos) && priceCentavos > 0)) {
    return Response.json({ error: 'priceCentavos must be a positive integer' }, { status: 400 })
  }

  const resourceType = await prisma.resourceType.findUnique({ where: { id: resourceTypeId } })
  if (!resourceType) {
    return Response.json({ error: 'Resource type not found' }, { status: 404 })
  }

  if (!isValidPricingRuleCombo(resourceType.slug, durationMinutes)) {
    return Response.json(
      { error: 'This resource/duration combination is not offered — see docs/business.md → Pricing' },
      { status: 400 },
    )
  }

  const existing = await prisma.pricingRule.findFirst({
    where: { resourceTypeId, durationMinutes },
  })
  if (existing) {
    return Response.json({ error: 'A pricing rule already exists for this combination' }, { status: 409 })
  }

  const pricingRule = await prisma.pricingRule.create({
    data: { resourceTypeId, durationMinutes, priceCentavos },
  })

  return Response.json(pricingRule, { status: 201 })
}
