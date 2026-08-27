'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCentavos } from '@/lib/format'
import DisableResourceModal from '@/components/admin/DisableResourceModal'
import PriceEditModal, { type PriceEditField } from '@/components/admin/PriceEditModal'
import type { Prisma, GuestFeeRule, ResourceCategory, RateTier } from '@prisma/client'

type ResourceTypeWithRelations = Prisma.ResourceTypeGetPayload<{
  include: {
    resources: true
    pricingRules: true
    addOnPricingRules: { include: { addOnService: true } }
  }
}>

type ResourceRow = ResourceTypeWithRelations['resources'][number]

type Tab = 'courts' | 'simulators' | 'guestFee'

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}

function durationLabel(minutes: number): string {
  return `${minutes} minutes`
}

function PencilIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 20l4.5-1 10-10a2 2 0 0 0 0-2.8l-1.7-1.7a2 2 0 0 0-2.8 0l-10 10L4 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditIconButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  )
}

function ActionIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="text-gray-400 hover:text-gray-700">
      <PencilIcon className="h-4 w-4" />
    </button>
  )
}

function PriceCell({ price, addLabel }: { price: number | undefined; addLabel: string }) {
  if (price === undefined) {
    return (
      <button
        type="button"
        disabled
        aria-label={addLabel}
        className="rounded border border-dashed border-gray-200 px-2 py-0.5 text-xs text-gray-400 disabled:cursor-not-allowed"
      >
        + Add
      </button>
    )
  }
  return <>{formatCentavos(price)}</>
}

function ResourceTypeCard({ rt }: { rt: ResourceTypeWithRelations }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [disablingResource, setDisablingResource] = useState<ResourceRow | null>(null)
  const [editingRow, setEditingRow] = useState<{ title: string; fields: PriceEditField[] } | null>(null)
  const isCourt: boolean = rt.category === ('court' as ResourceCategory)

  async function handleEnable(resource: ResourceRow) {
    if (!window.confirm(`Enable ${resource.label}? This will clear its disabled reason.`)) {
      return
    }
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        alert(json?.error ?? 'Failed to enable resource.')
        return
      }
      router.refresh()
    } catch {
      alert('Failed to enable resource.')
    }
  }
  const durations = isCourt
    ? [60]
    : Array.from(new Set(rt.pricingRules.map((r) => r.durationMinutes))).sort((a, b) => a - b)

  function findRateRule(tier: RateTier, durationMinutes: number) {
    return rt.pricingRules.find((r) => r.rateTier === tier && r.durationMinutes === durationMinutes)
  }

  function findRate(tier: RateTier, durationMinutes: number) {
    return findRateRule(tier, durationMinutes)?.priceCentavos
  }

  const coachingRules = rt.addOnPricingRules.filter((r) => r.addOnService.slug === 'coaching_fee')
  const ballBoyRules = rt.addOnPricingRules.filter((r) => r.addOnService.slug === 'ball_boy')

  function findCoachingRule(tier: RateTier, paxCount: number | null) {
    return coachingRules.find((r) => r.rateTier === tier && r.paxCount === paxCount)
  }

  function findCoaching(tier: RateTier, paxCount: number | null) {
    return findCoachingRule(tier, paxCount)?.priceCentavos
  }

  function findBallBoyRule(tier: RateTier) {
    return ballBoyRules.find((r) => r.rateTier === tier)
  }

  function findBallBoy(tier: RateTier) {
    return findBallBoyRule(tier)?.priceCentavos
  }

  function buildRateFields(rowLabel: string, durationMinutes: number): PriceEditField[] {
    const memberRule = findRateRule('member', durationMinutes)
    const nonMemberRule = findRateRule('non_member', durationMinutes)
    const fields: PriceEditField[] = []
    if (memberRule) {
      fields.push({
        key: 'member',
        label: 'Member rate',
        endpoint: `/api/admin/pricing-rules/${memberRule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: memberRule.priceCentavos,
      })
    }
    if (nonMemberRule) {
      fields.push({
        key: 'nonMember',
        label: 'Non-Member rate',
        endpoint: `/api/admin/pricing-rules/${nonMemberRule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: nonMemberRule.priceCentavos,
      })
    }
    return fields
  }

  function buildCoachingFields(paxCount: number | null): PriceEditField[] {
    const memberRule = findCoachingRule('member', paxCount)
    const nonMemberRule = findCoachingRule('non_member', paxCount)
    const fields: PriceEditField[] = []
    if (memberRule) {
      fields.push({
        key: 'member',
        label: 'Member rate',
        endpoint: `/api/admin/add-on-pricing-rules/${memberRule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: memberRule.priceCentavos,
      })
    }
    if (nonMemberRule) {
      fields.push({
        key: 'nonMember',
        label: 'Non-Member rate',
        endpoint: `/api/admin/add-on-pricing-rules/${nonMemberRule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: nonMemberRule.priceCentavos,
      })
    }
    return fields
  }

  function buildBallBoyFields(): PriceEditField[] {
    const memberRule = findBallBoyRule('member')
    const nonMemberRule = findBallBoyRule('non_member')
    const fields: PriceEditField[] = []
    if (memberRule) {
      fields.push({
        key: 'member',
        label: 'Member rate',
        endpoint: `/api/admin/add-on-pricing-rules/${memberRule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: memberRule.priceCentavos,
      })
    }
    if (nonMemberRule) {
      fields.push({
        key: 'nonMember',
        label: 'Non-Member rate',
        endpoint: `/api/admin/add-on-pricing-rules/${nonMemberRule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: nonMemberRule.priceCentavos,
      })
    }
    return fields
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 text-left"
        >
          <ChevronIcon
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
          <h2 className="text-base font-semibold text-gray-900">{rt.name}</h2>
          <span className="text-xs text-gray-500">{pluralize(rt.resources.length, 'resource')}</span>
        </button>
      </div>

      {isOpen && (
        <>
          <div className="mb-5 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {rt.resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-900">{resource.label}</span>
                  {!resource.isActive && resource.disabledReason && (
                    <span className="text-xs text-gray-400">{resource.disabledReason}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      resource.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {resource.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {resource.isActive ? (
                    <button
                      type="button"
                      onClick={() => setDisablingResource(resource)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnable(resource)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[500px] border-collapse text-sm">
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
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {durations.map((duration) => {
                  const rowLabel = isCourt ? 'Hourly rate' : durationLabel(duration)
                  return (
                    <tr key={duration} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-2 text-gray-900">{rowLabel}</td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell
                          price={findRate('member', duration)}
                          addLabel={`Add ${rowLabel} member rate`}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell
                          price={findRate('non_member', duration)}
                          addLabel={`Add ${rowLabel} non-member rate`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const fields = buildRateFields(rowLabel, duration)
                          return fields.length > 0 ? (
                            <ActionIconButton
                              label={`Edit ${rowLabel}`}
                              onClick={() => setEditingRow({ title: `Edit ${rowLabel}`, fields })}
                            />
                          ) : (
                            <EditIconButton label={`Edit ${rowLabel}`} />
                          )
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[500px] border-collapse text-sm">
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
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isCourt ? (
                  <>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-900">Coaching (1 pax)</td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell
                          price={findCoaching('member', 1)}
                          addLabel="Add Coaching (1 pax) member rate"
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell
                          price={findCoaching('non_member', 1)}
                          addLabel="Add Coaching (1 pax) non-member rate"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const fields = buildCoachingFields(1)
                          return fields.length > 0 ? (
                            <ActionIconButton
                              label="Edit Coaching (1 pax)"
                              onClick={() => setEditingRow({ title: 'Edit Coaching (1 pax)', fields })}
                            />
                          ) : (
                            <EditIconButton label="Edit Coaching (1 pax)" />
                          )
                        })()}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-900">Coaching (2 pax)</td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell
                          price={findCoaching('member', 2)}
                          addLabel="Add Coaching (2 pax) member rate"
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell
                          price={findCoaching('non_member', 2)}
                          addLabel="Add Coaching (2 pax) non-member rate"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const fields = buildCoachingFields(2)
                          return fields.length > 0 ? (
                            <ActionIconButton
                              label="Edit Coaching (2 pax)"
                              onClick={() => setEditingRow({ title: 'Edit Coaching (2 pax)', fields })}
                            />
                          ) : (
                            <EditIconButton label="Edit Coaching (2 pax)" />
                          )
                        })()}
                      </td>
                    </tr>
                    <tr className="last:border-b-0">
                      <td className="px-3 py-2 text-gray-900">Ball Boy</td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell price={findBallBoy('member')} addLabel="Add Ball Boy member rate" />
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        <PriceCell price={findBallBoy('non_member')} addLabel="Add Ball Boy non-member rate" />
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const fields = buildBallBoyFields()
                          return fields.length > 0 ? (
                            <ActionIconButton
                              label="Edit Ball Boy"
                              onClick={() => setEditingRow({ title: 'Edit Ball Boy', fields })}
                            />
                          ) : (
                            <EditIconButton label="Edit Ball Boy" />
                          )
                        })()}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr className="last:border-b-0">
                    <td className="px-3 py-2 text-gray-900">Coaching</td>
                    <td className="px-3 py-2 text-gray-900">
                      <PriceCell price={findCoaching('member', null)} addLabel="Add Coaching member rate" />
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      <PriceCell
                        price={findCoaching('non_member', null)}
                        addLabel="Add Coaching non-member rate"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {(() => {
                        const fields = buildCoachingFields(null)
                        return fields.length > 0 ? (
                          <ActionIconButton
                            label="Edit Coaching"
                            onClick={() => setEditingRow({ title: 'Edit Coaching', fields })}
                          />
                        ) : (
                          <EditIconButton label="Edit Coaching" />
                        )
                      })()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <DisableResourceModal
        isOpen={disablingResource !== null}
        onClose={() => setDisablingResource(null)}
        resource={disablingResource}
      />
      <PriceEditModal
        isOpen={editingRow !== null}
        onClose={() => setEditingRow(null)}
        title={editingRow?.title ?? ''}
        fields={editingRow?.fields ?? []}
      />
    </div>
  )
}

interface ResourcesTabsProps {
  courts: ResourceTypeWithRelations[]
  simulators: ResourceTypeWithRelations[]
  guestFeeRule: GuestFeeRule | null
}

export default function ResourcesTabs({ courts, simulators, guestFeeRule }: ResourcesTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('courts')
  const [editingGuestFee, setEditingGuestFee] = useState(false)

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: 'courts', label: 'Courts' },
    { key: 'simulators', label: 'Simulators' },
    { key: 'guestFee', label: 'Guest Fee' },
  ]

  return (
    <div>
      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'courts' && (
        <div className="space-y-6">
          {courts.map((rt) => (
            <ResourceTypeCard key={rt.id} rt={rt} />
          ))}
        </div>
      )}

      {activeTab === 'simulators' && (
        <div className="space-y-6">
          {simulators.map((rt) => (
            <ResourceTypeCard key={rt.id} rt={rt} />
          ))}
        </div>
      )}

      {activeTab === 'guestFee' && guestFeeRule && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Guest Fee</h2>
            <ActionIconButton
              label="Edit Guest Fee"
              onClick={() => setEditingGuestFee(true)}
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-gray-500">Non-member court guest surcharge</span>
            <span className="text-right font-medium text-gray-900">
              {formatCentavos(guestFeeRule.amountCentavos)}/hr
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Applies to non-member court bookings only; the booker is exempt from their own guest fee.
          </p>
          <PriceEditModal
            isOpen={editingGuestFee}
            onClose={() => setEditingGuestFee(false)}
            title="Edit Guest Fee"
            fields={[
              {
                key: 'amount',
                label: 'Guest fee (per guest/hr)',
                endpoint: `/api/admin/guest-fee-rule/${guestFeeRule.id}`,
                bodyKey: 'amountCentavos',
                currentCentavos: guestFeeRule.amountCentavos,
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
