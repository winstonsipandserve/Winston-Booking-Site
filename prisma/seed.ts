import { PrismaClient, ResourceTypeSlug, ResourceCategory, RateTier, AddOnServiceSlug } from '@prisma/client'

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

  const addOnServices = [
    { slug: AddOnServiceSlug.ball_boy, name: 'Ball Boy' },
    { slug: AddOnServiceSlug.coaching_fee, name: 'Coaching' },
  ]

  for (const service of addOnServices) {
    await prisma.addOnService.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    })
  }

  // "No row = not offered" — e.g. non-member tennis-sim/pickleball-sim coaching
  // intentionally has no row, same precedent as the non-member golf-sim 30-min PricingRule.
  const addOnPricingRules: {
    serviceSlug: AddOnServiceSlug
    resourceSlug: ResourceTypeSlug
    rateTier: RateTier
    paxCount: number | null
    priceCentavos: number
  }[] = [
    // Ball Boy — court only, no pax tier
    { serviceSlug: AddOnServiceSlug.ball_boy, resourceSlug: ResourceTypeSlug.tennis_court, rateTier: RateTier.member, paxCount: null, priceCentavos: 15000 },
    { serviceSlug: AddOnServiceSlug.ball_boy, resourceSlug: ResourceTypeSlug.tennis_court, rateTier: RateTier.non_member, paxCount: null, priceCentavos: 15000 },
    { serviceSlug: AddOnServiceSlug.ball_boy, resourceSlug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.member, paxCount: null, priceCentavos: 15000 },
    { serviceSlug: AddOnServiceSlug.ball_boy, resourceSlug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.non_member, paxCount: null, priceCentavos: 15000 },
    // Coaching — courts, pax 1/2
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.tennis_court, rateTier: RateTier.member, paxCount: 1, priceCentavos: 75000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.tennis_court, rateTier: RateTier.member, paxCount: 2, priceCentavos: 120000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.tennis_court, rateTier: RateTier.non_member, paxCount: 1, priceCentavos: 80000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.tennis_court, rateTier: RateTier.non_member, paxCount: 2, priceCentavos: 120000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.member, paxCount: 1, priceCentavos: 75000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.member, paxCount: 2, priceCentavos: 120000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.non_member, paxCount: 1, priceCentavos: 80000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.pickleball_court, rateTier: RateTier.non_member, paxCount: 2, priceCentavos: 120000 },
    // Coaching — simulators, no pax tier. Non-member tennis-sim/pickleball-sim intentionally omitted (not offered).
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.tennis_sim, rateTier: RateTier.member, paxCount: null, priceCentavos: 80000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.pickleball_sim, rateTier: RateTier.member, paxCount: null, priceCentavos: 80000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.golf_sim, rateTier: RateTier.member, paxCount: null, priceCentavos: 100000 },
    { serviceSlug: AddOnServiceSlug.coaching_fee, resourceSlug: ResourceTypeSlug.golf_sim, rateTier: RateTier.non_member, paxCount: null, priceCentavos: 100000 },
  ]

  for (const rule of addOnPricingRules) {
    const addOnService = await prisma.addOnService.findUniqueOrThrow({ where: { slug: rule.serviceSlug } })
    const resourceType = await prisma.resourceType.findUniqueOrThrow({ where: { slug: rule.resourceSlug } })
    // Prisma's compound-unique input rejects null for a nullable field at runtime
    // (known Prisma limitation), so paxCount: null rows can't go through .upsert()'s
    // compound `where` — fall back to findFirst + create/update, same as the Resource
    // seed block above.
    const existingRule = await prisma.addOnPricingRule.findFirst({
      where: {
        addOnServiceId: addOnService.id,
        resourceTypeId: resourceType.id,
        rateTier: rule.rateTier,
        paxCount: rule.paxCount,
      },
    })
    if (existingRule) {
      await prisma.addOnPricingRule.update({
        where: { id: existingRule.id },
        data: { priceCentavos: rule.priceCentavos },
      })
    } else {
      await prisma.addOnPricingRule.create({
        data: {
          addOnServiceId: addOnService.id,
          resourceTypeId: resourceType.id,
          rateTier: rule.rateTier,
          paxCount: rule.paxCount,
          priceCentavos: rule.priceCentavos,
        },
      })
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
