import { prisma } from '@/lib/prisma'

export async function GET() {
  const [resourceTypes, pricingRules, addOnPricingRules, guestFeeRule] = await Promise.all([
    prisma.resourceType.findMany({
      include: { resources: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.pricingRule.findMany(),
    prisma.addOnPricingRule.findMany({ include: { addOnService: true } }),
    prisma.guestFeeRule.findFirst(),
  ])

  const responseResourceTypes = resourceTypes.map((resourceType) => ({
    id: resourceType.id,
    slug: resourceType.slug,
    name: resourceType.name,
    category: resourceType.category,
    resources: resourceType.resources.map((resource) => ({
      id: resource.id,
      label: resource.label,
    })),
    pricing: pricingRules
      .filter((pricingRule) => pricingRule.resourceTypeId === resourceType.id)
      .map((pricingRule) => ({
        rateTier: pricingRule.rateTier,
        durationMinutes: pricingRule.durationMinutes,
        priceCentavos: pricingRule.priceCentavos,
      })),
    addOnPricing: addOnPricingRules
      .filter((addOnPricingRule) => addOnPricingRule.resourceTypeId === resourceType.id)
      .map((addOnPricingRule) => ({
        service: addOnPricingRule.addOnService.slug,
        rateTier: addOnPricingRule.rateTier,
        paxCount: addOnPricingRule.paxCount,
        priceCentavos: addOnPricingRule.priceCentavos,
      })),
  }))

  return Response.json(
    {
      resourceTypes: responseResourceTypes,
      guestFeeCentavos: guestFeeRule?.amountCentavos ?? 0,
    },
    { status: 200 },
  )
}
