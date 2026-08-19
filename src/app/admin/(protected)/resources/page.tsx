import { prisma } from '@/lib/prisma'
import { formatCentavos } from '@/lib/format'
import { ResourceTypeSlug } from '@prisma/client'
import type { ResourceCategory, RateTier } from '@prisma/client'

const RESOURCE_TYPE_ORDER: ResourceTypeSlug[] = [
  ResourceTypeSlug.tennis_court,
  ResourceTypeSlug.pickleball_court,
  ResourceTypeSlug.tennis_sim,
  ResourceTypeSlug.pickleball_sim,
  ResourceTypeSlug.golf_sim,
]

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}

function durationLabel(minutes: number): string {
  return `${minutes} minutes`
}

function PriceCell({ price }: { price: number | undefined }) {
  if (price === undefined) {
    return <span className="italic text-gray-400">Not offered</span>
  }
  return <>{formatCentavos(price)}</>
}

export default async function AdminResourcesPage() {
  const [resourceTypes, guestFeeRule] = await Promise.all([
    prisma.resourceType.findMany({
      include: {
        resources: { orderBy: { label: 'asc' } },
        pricingRules: true,
        addOnPricingRules: { include: { addOnService: true } },
      },
    }),
    prisma.guestFeeRule.findFirst(),
  ])

  const orderedResourceTypes = RESOURCE_TYPE_ORDER.map((slug) =>
    resourceTypes.find((rt) => rt.slug === slug),
  ).filter((rt): rt is (typeof resourceTypes)[number] => rt !== undefined)

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Resources & Pricing</h1>
      <p className="mb-6 text-sm italic text-gray-400">
        Read-only for now — editing resource status and pricing requires a direct database update
        until the mutation slice is built.
      </p>

      <div className="space-y-6">
        {orderedResourceTypes.map((rt) => {
          const isCourt: boolean = rt.category === ('court' as ResourceCategory)
          const durations = isCourt
            ? [60]
            : Array.from(new Set(rt.pricingRules.map((r) => r.durationMinutes))).sort((a, b) => a - b)

          function findRate(tier: RateTier, durationMinutes: number) {
            return rt.pricingRules.find(
              (r) => r.rateTier === tier && r.durationMinutes === durationMinutes,
            )?.priceCentavos
          }

          const coachingRules = rt.addOnPricingRules.filter(
            (r) => r.addOnService.slug === 'coaching_fee',
          )
          const ballBoyRules = rt.addOnPricingRules.filter((r) => r.addOnService.slug === 'ball_boy')

          function findCoaching(tier: RateTier, paxCount: number | null) {
            return coachingRules.find((r) => r.rateTier === tier && r.paxCount === paxCount)
              ?.priceCentavos
          }

          function findBallBoy(tier: RateTier) {
            return ballBoyRules.find((r) => r.rateTier === tier)?.priceCentavos
          }

          return (
            <div key={rt.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">{rt.name}</h2>
                <span className="text-xs text-gray-500">{pluralize(rt.resources.length, 'resource')}</span>
              </div>

              <div className="mb-5 divide-y divide-gray-100 rounded-lg border border-gray-200">
                {rt.resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-900">{resource.label}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        resource.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {resource.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                        {isCourt ? 'Rate' : 'Duration'}
                      </th>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                        Member
                      </th>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                        Non-Member
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {durations.map((duration) => (
                      <tr key={duration} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-3 py-2 text-gray-900">
                          {isCourt ? 'Hourly rate' : durationLabel(duration)}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          <PriceCell price={findRate('member', duration)} />
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          <PriceCell price={findRate('non_member', duration)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                        Add-on
                      </th>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                        Member
                      </th>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                        Non-Member
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isCourt ? (
                      <>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-900">Coaching (1 pax)</td>
                          <td className="px-3 py-2 text-gray-900">
                            <PriceCell price={findCoaching('member', 1)} />
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            <PriceCell price={findCoaching('non_member', 1)} />
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-900">Coaching (2 pax)</td>
                          <td className="px-3 py-2 text-gray-900">
                            <PriceCell price={findCoaching('member', 2)} />
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            <PriceCell price={findCoaching('non_member', 2)} />
                          </td>
                        </tr>
                        <tr className="last:border-b-0">
                          <td className="px-3 py-2 text-gray-900">Ball Boy</td>
                          <td className="px-3 py-2 text-gray-900">
                            <PriceCell price={findBallBoy('member')} />
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            <PriceCell price={findBallBoy('non_member')} />
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr className="last:border-b-0">
                        <td className="px-3 py-2 text-gray-900">Coaching</td>
                        <td className="px-3 py-2 text-gray-900">
                          <PriceCell price={findCoaching('member', null)} />
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          <PriceCell price={findCoaching('non_member', null)} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {guestFeeRule && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Guest Fee</h2>
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-gray-500">Non-member court guest surcharge</span>
              <span className="text-right font-medium text-gray-900">
                {formatCentavos(guestFeeRule.amountCentavos)}/hr
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Applies to non-member court bookings only; the booker is exempt from their own guest fee.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
