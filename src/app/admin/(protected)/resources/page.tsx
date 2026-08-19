import { prisma } from '@/lib/prisma'
import { ResourceTypeSlug } from '@prisma/client'
import ResourcesTabs from '@/components/admin/ResourcesTabs'

const RESOURCE_TYPE_ORDER: ResourceTypeSlug[] = [
  ResourceTypeSlug.tennis_court,
  ResourceTypeSlug.pickleball_court,
  ResourceTypeSlug.tennis_sim,
  ResourceTypeSlug.pickleball_sim,
  ResourceTypeSlug.golf_sim,
]

export default async function AdminResourcesPage() {
  const [resourceTypes, guestFeeRule] = await Promise.all([
    prisma.resourceType.findMany({
      include: {
        resources: { orderBy: { label: 'asc' } },
        pricingRules: true,
        addOnPricingRules: { include: { addOnService: true } },
      },
      relationLoadStrategy: 'query',
    }),
    prisma.guestFeeRule.findFirst(),
  ])

  const orderedResourceTypes = RESOURCE_TYPE_ORDER.map((slug) =>
    resourceTypes.find((rt) => rt.slug === slug),
  ).filter((rt): rt is (typeof resourceTypes)[number] => rt !== undefined)

  const courts = orderedResourceTypes.filter((rt) => rt.category === 'court')
  const simulators = orderedResourceTypes.filter((rt) => rt.category === 'simulator')

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Resources & Pricing</h1>
      <p className="mb-6 text-sm italic text-gray-400">
        Add/Edit/Delete on resources (courts, bays) are live. Pricing, add-on, and guest fee editing
        controls below are still previews only — changes there require a direct database update
        until that mutation slice ships.
      </p>

      <ResourcesTabs courts={courts} simulators={simulators} guestFeeRule={guestFeeRule} />
    </div>
  )
}
