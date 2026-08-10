import { PrismaClient, ResourceTypeSlug, ResourceCategory } from '@prisma/client'

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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
