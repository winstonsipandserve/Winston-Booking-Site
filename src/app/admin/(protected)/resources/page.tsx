import { prisma } from '@/lib/prisma'
import { ResourceTypeSlug } from '@prisma/client'
import ResourcesTabs from '@/components/admin/ResourcesTabs'
import { getGuestFeeRule } from '@/lib/guest-fee'

const RESOURCE_TYPE_ORDER: ResourceTypeSlug[] = [
  ResourceTypeSlug.pickleball_court,
  ResourceTypeSlug.tennis_sim,
  ResourceTypeSlug.pickleball_sim,
  ResourceTypeSlug.golf_sim,
  ResourceTypeSlug.lounge,
  ResourceTypeSlug.conference_room,
]

export default async function AdminResourcesPage() {
  const [resourceTypes, guestFeeRule, addOnServices] = await Promise.all([
    prisma.resourceType.findMany({
      include: {
        resources: { orderBy: { label: 'asc' } },
        pricingRules: true,
        addOnPricingRules: { include: { addOnService: true } },
      },
      relationLoadStrategy: 'join',
    }),
    getGuestFeeRule(),
    prisma.addOnService.findMany(),
  ])

  const orderedResourceTypes = RESOURCE_TYPE_ORDER.map((slug) =>
    resourceTypes.find((rt) => rt.slug === slug),
  ).filter((rt): rt is (typeof resourceTypes)[number] => rt !== undefined)

  const courts = orderedResourceTypes.filter((rt) => rt.category === 'court')
  const simulators = orderedResourceTypes.filter((rt) => rt.category === 'simulator')
  const spaces = orderedResourceTypes.filter((rt) => rt.category === 'space')

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="min-h-0 flex-1">
        <ResourcesTabs
          courts={courts}
          simulators={simulators}
          spaces={spaces}
          guestFeeRule={guestFeeRule}
          addOnServices={addOnServices}
        />
      </div>
    </div>
  )
}
