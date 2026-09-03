import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { RateTier } from '@prisma/client'
import { isValidAddOnPricingRuleCombo } from '@/lib/pricing-rule-combos'

interface CreateAddOnPricingRuleBody {
  addOnServiceId?: unknown
  resourceTypeId?: unknown
  rateTier?: unknown
  paxCount?: unknown
  priceCentavos?: unknown
}

function isValidRateTier(value: unknown): value is RateTier {
  return typeof value === 'string' && (Object.values(RateTier) as string[]).includes(value)
}

function parsePaxCount(value: unknown): { ok: true; paxCount: number | null } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, paxCount: null }
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return { ok: true, paxCount: value }
  return { ok: false }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateAddOnPricingRuleBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { addOnServiceId, resourceTypeId, rateTier, priceCentavos } = body

  if (typeof addOnServiceId !== 'string' || addOnServiceId.trim() === '') {
    return Response.json({ error: 'addOnServiceId is required' }, { status: 400 })
  }
  if (typeof resourceTypeId !== 'string' || resourceTypeId.trim() === '') {
    return Response.json({ error: 'resourceTypeId is required' }, { status: 400 })
  }
  if (!isValidRateTier(rateTier)) {
    return Response.json({ error: 'rateTier must be a valid rate tier' }, { status: 400 })
  }
  const paxResult = parsePaxCount(body.paxCount)
  if (!paxResult.ok) {
    return Response.json({ error: 'paxCount must be a positive integer or null' }, { status: 400 })
  }
  if (!(typeof priceCentavos === 'number' && Number.isInteger(priceCentavos) && priceCentavos > 0)) {
    return Response.json({ error: 'priceCentavos must be a positive integer' }, { status: 400 })
  }

  const [addOnService, resourceType] = await Promise.all([
    prisma.addOnService.findUnique({ where: { id: addOnServiceId } }),
    prisma.resourceType.findUnique({ where: { id: resourceTypeId } }),
  ])
  if (!addOnService) {
    return Response.json({ error: 'Add-on service not found' }, { status: 404 })
  }
  if (!resourceType) {
    return Response.json({ error: 'Resource type not found' }, { status: 404 })
  }

  const { paxCount } = paxResult

  if (!isValidAddOnPricingRuleCombo(addOnService.slug, resourceType.slug, rateTier, paxCount)) {
    return Response.json(
      { error: 'This add-on/resource/rate combination is not offered — see PROJECT_CONTEXT.md\'s Add-On Services section' },
      { status: 400 },
    )
  }

  const existing = await prisma.addOnPricingRule.findFirst({
    where: { addOnServiceId, resourceTypeId, rateTier, paxCount },
  })
  if (existing) {
    return Response.json({ error: 'A pricing rule already exists for this combination' }, { status: 409 })
  }

  const addOnPricingRule = await prisma.addOnPricingRule.create({
    data: { addOnServiceId, resourceTypeId, rateTier, paxCount, priceCentavos },
  })

  return Response.json(addOnPricingRule, { status: 201 })
}
