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
  const [resourceTypes, guestFeeRule, addOnServices] = await Promise.all([
    prisma.resourceType.findMany({
      include: {
        resources: { orderBy: { label: 'asc' } },
        pricingRules: true,
        addOnPricingRules: { include: { addOnService: true } },
      },
      relationLoadStrategy: 'join',
    }),
    prisma.guestFeeRule.findFirst(),
    prisma.addOnService.findMany(),
  ])

  const orderedResourceTypes = RESOURCE_TYPE_ORDER.map((slug) =>
    resourceTypes.find((rt) => rt.slug === slug),
  ).filter((rt): rt is (typeof resourceTypes)[number] => rt !== undefined)

  const courts = orderedResourceTypes.filter((rt) => rt.category === 'court')
  const simulators = orderedResourceTypes.filter((rt) => rt.category === 'simulator')

  return (
    <div className="relative isolate flex h-full flex-col gap-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 hidden -z-10 dark:block dark:rounded-2xl dark:bg-gray-900"
      />
      <div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Resources & Pricing</h1>
        <p className="text-sm italic text-gray-400 dark:text-gray-500">
          New courts and simulators are added directly in the database — existing ones can only be
          edited (pricing) or disabled/enabled from this panel. Pricing and add-on rows below support
          full create/edit/delete. Guest Fee remains edit-only, permanently, by design — its shape has
          nothing to key a second row on.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <ResourcesTabs
          courts={courts}
          simulators={simulators}
          guestFeeRule={guestFeeRule}
          addOnServices={addOnServices}
        />
      </div>
    </div>
  )
}
