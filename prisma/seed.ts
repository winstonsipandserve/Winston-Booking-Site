import { PrismaClient, ResourceTypeSlug, ResourceCategory, RateTier } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const resourceTypes = [
    { slug: ResourceTypeSlug.tennis_court, name: 'Tennis Court', category: ResourceCategory.court },
    { slug: ResourceTypeSlug.pickleball_court, name: 'Pickleball Court', category: ResourceCategory.court },
    { slug: ResourceTypeSlug.tennis_sim, name: 'Tennis Simulator', category: ResourceCategory.simulator },
    { slug: ResourceTypeSlug.pickleball_sim, name: 'Pickleball Simulator', category: ResourceCategory.simulator },
    { slug: ResourceTypeSlug.golf_sim, name: 'Golf Simulator', category: ResourceCategory.simulator },
  ]

  for (const rt of resourceTypes) {
    await prisma.resourceType.upsert({
      where: { slug: rt.slug },
      update: {},
      create: rt,
    })
  }

  const inventory: { slug: ResourceTypeSlug; labels: string[] }[] = [
    { slug: ResourceTypeSlug.tennis_court, labels: ['Court 1'] },
    { slug: ResourceTypeSlug.pickleball_court, labels: ['Court 1', 'Court 2', 'Court 3'] },
    { slug: ResourceTypeSlug.tennis_sim, labels: ['Bay 1'] },
    { slug: ResourceTypeSlug.pickleball_sim, labels: ['Bay 1', 'Bay 2'] },
    { slug: ResourceTypeSlug.golf_sim, labels: ['Bay 1', 'Bay 2'] },
  ]

  for (const group of inventory) {
    const resourceType = await prisma.resourceType.findUniqueOrThrow({ where: { slug: group.slug } })
    for (const label of group.labels) {
      const existing = await prisma.resource.findFirst({
        where: { resourceTypeId: resourceType.id, label },
      })
      if (!existing) {
        await prisma.resource.create({
          data: { resourceTypeId: resourceType.id, label },
        })
      }
    }
  }

  // Court rates are flat hourly — stored as a single durationMinutes=60 row per
  // type/tier that the booking API multiplies by (durationMinutes / 60).
  // Simulator rates are tiered by duration; a missing row for a given
  // type/tier/duration combo (e.g. non-member golf-sim 30-min) is intentional.
  const pricingRules: { slug: ResourceTypeSlug; rateTier: RateTier; durationMinutes: number; priceCentavos: number }[] = [
    // Tennis court (flat hourly)
    { slug: ResourceTypeSlug.tennis_court, rateTier: RateTier.member, durationMinutes: 60, priceCentavos: 65000 },
    { slug: ResourceTypeSlug.tennis_court, rateTier: RateTier.non_member, durationMinutes: 60, priceCentavos: 75000 },
    // Pickleball court (flat hourly)
    { slug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.member, durationMinutes: 60, priceCentavos: 55000 },
    { slug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.non_member, durationMinutes: 60, priceCentavos: 65000 },
    // Tennis simulator (tiered)
    { slug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.member, durationMinutes: 15, priceCentavos: 25000 },
    { slug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.member, durationMinutes: 30, priceCentavos: 40000 },
    { slug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.member, durationMinutes: 60, priceCentavos: 75000 },
    { slug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.non_member, durationMinutes: 15, priceCentavos: 30000 },
    { slug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.non_member, durationMinutes: 30, priceCentavos: 45000 },
    { slug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.non_member, durationMinutes: 60, priceCentavos: 80000 },
    // Pickleball simulator (tiered)
    { slug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.member, durationMinutes: 15, priceCentavos: 25000 },
    { slug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.member, durationMinutes: 30, priceCentavos: 40000 },
    { slug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.member, durationMinutes: 60, priceCentavos: 75000 },
    { slug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.non_member, durationMinutes: 15, priceCentavos: 30000 },
    { slug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.non_member, durationMinutes: 30, priceCentavos: 45000 },
    { slug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.non_member, durationMinutes: 60, priceCentavos: 80000 },
    // Golf simulator (tiered) — no non-member 30-min row, intentionally
    { slug: ResourceTypeSlug.golf_sim, rateTier: RateTier.member, durationMinutes: 30, priceCentavos: 45000 },
    { slug: ResourceTypeSlug.golf_sim, rateTier: RateTier.member, durationMinutes: 60, priceCentavos: 95000 },
    { slug: ResourceTypeSlug.golf_sim, rateTier: RateTier.member, durationMinutes: 90, priceCentavos: 140000 },
    { slug: ResourceTypeSlug.golf_sim, rateTier: RateTier.non_member, durationMinutes: 60, priceCentavos: 115000 },
    { slug: ResourceTypeSlug.golf_sim, rateTier: RateTier.non_member, durationMinutes: 90, priceCentavos: 145000 },
  ]

  for (const rule of pricingRules) {
    const resourceType = await prisma.resourceType.findUniqueOrThrow({ where: { slug: rule.slug } })
    await prisma.pricingRule.upsert({
      where: {
        resourceTypeId_rateTier_durationMinutes: {
          resourceTypeId: resourceType.id,
          rateTier: rule.rateTier,
          durationMinutes: rule.durationMinutes,
        },
      },
      update: { priceCentavos: rule.priceCentavos },
      create: {
        resourceTypeId: resourceType.id,
        rateTier: rule.rateTier,
        durationMinutes: rule.durationMinutes,
        priceCentavos: rule.priceCentavos,
      },
    })
  }

  const existingGuestFeeRule = await prisma.guestFeeRule.findFirst()
  if (!existingGuestFeeRule) {
    await prisma.guestFeeRule.create({
      data: { amountCentavos: 15000 },
    })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
