'use client'

import { useId, useState } from 'react'
import AdminTabs, { AdminTabPanel } from '@/components/admin/AdminTabs'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/admin/ToastProvider'
import { formatCentavos } from '@/lib/format'
import DisableResourceModal from '@/components/admin/DisableResourceModal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import PriceEditModal, { type PriceEditField, type PriceCreateField } from '@/components/admin/PriceEditModal'
import type { Prisma, GuestFeeRule, ResourceCategory, RateTier, AddOnService } from '@prisma/client'
import { isValidPricingRuleCombo, isValidAddOnPricingRuleCombo } from '@/lib/pricing-rule-combos'
import { MEMBERSHIP_TIER_ORDER, MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'

const tierDiscountSummary = MEMBERSHIP_TIER_ORDER.map(
  (tier) => `${MEMBERSHIP_TIER_PLANS[tier].name} ${MEMBERSHIP_TIER_PLANS[tier].bookingDiscountPercent}%`,
).join(' · ')

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

function ActionIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="-m-2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
      <PencilIcon className="h-4 w-4" />
    </button>
  )
}

function PriceCell({
  price,
  allowed,
  addLabel,
  onAdd,
}: {
  price: number | undefined
  allowed: boolean
  addLabel: string
  onAdd: () => void
}) {
  if (price === undefined) {
    if (!allowed) return null
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        className="rounded border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        + Add
      </button>
    )
  }
  return (
    <span>{formatCentavos(price)}</span>
  )
}

function tierLabel(tier: RateTier): string {
  return tier === 'member' ? 'Member' : 'Non-Member'
}

function ResourceTypeCard({
  rt,
  addOnServices,
  defaultOpen = false,
}: {
  rt: ResourceTypeWithRelations
  addOnServices: AddOnService[]
  defaultOpen?: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [disablingResource, setDisablingResource] = useState<ResourceRow | null>(null)
  const [editingRow, setEditingRow] = useState<{ title: string; fields: PriceEditField[] } | null>(null)
  const [creatingCell, setCreatingCell] = useState<{ title: string; createField: PriceCreateField } | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    title: string
    message: string
    confirmLabel: string
    confirmVariant: 'default' | 'danger'
    onConfirm: () => void
  } | null>(null)
  const isCourt: boolean = rt.category === ('court' as ResourceCategory)


  function openCreateRate(durationMinutes: number, rowLabel: string) {
    setCreatingCell({
      title: `Add ${rowLabel}`,
      createField: {
        label: 'Base rate',
        endpoint: '/api/admin/pricing-rules',
        body: { resourceTypeId: rt.id, durationMinutes },
      },
    })
  }

  function openCreateCoaching(tier: RateTier, paxCount: number | null, rowLabel: string) {
    const coachingService = addOnServices.find((s) => s.slug === 'coaching_fee')
    if (!coachingService) return
    setCreatingCell({
      title: `Add ${rowLabel} ${tierLabel(tier)} rate`,
      createField: {
        label: `${tierLabel(tier)} rate`,
        endpoint: '/api/admin/add-on-pricing-rules',
        body: { addOnServiceId: coachingService.id, resourceTypeId: rt.id, rateTier: tier, paxCount },
      },
    })
  }

  async function doEnable(resource: ResourceRow) {
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error ?? 'Failed to enable resource.')
        return
      }
      router.refresh()
      toast.success(`${resource.label} enabled.`)
    } catch {
      toast.error('Failed to enable resource.')
    }
  }

  function handleEnable(resource: ResourceRow) {
    setPendingAction({
      title: 'Enable Resource?',
      message: `Enable ${resource.label}? This will clear its disabled reason.`,
      confirmLabel: 'Enable',
      confirmVariant: 'default',
      onConfirm: () => {
        setPendingAction(null)
        void doEnable(resource)
      },
    })
  }
  const durations = isCourt
    ? [60]
    : Array.from(new Set(rt.pricingRules.map((r) => r.durationMinutes))).sort((a, b) => a - b)

  function findRateRule(durationMinutes: number) {
    return rt.pricingRules.find((r) => r.durationMinutes === durationMinutes)
  }

  const coachingRules = rt.addOnPricingRules.filter((r) => r.addOnService.slug === 'coaching_fee')

  function findCoachingRule(tier: RateTier, paxCount: number | null) {
    return coachingRules.find((r) => r.rateTier === tier && r.paxCount === paxCount)
  }

  function findCoaching(tier: RateTier, paxCount: number | null) {
    return findCoachingRule(tier, paxCount)?.priceCentavos
  }

  function buildRateFields(durationMinutes: number): PriceEditField[] {
    const rule = findRateRule(durationMinutes)
    if (!rule) return []
    return [
      {
        key: 'base',
        label: 'Base rate',
        endpoint: `/api/admin/pricing-rules/${rule.id}`,
        bodyKey: 'priceCentavos',
        currentCentavos: rule.priceCentavos,
      },
    ]
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

  // Collapsed header summary so pricing is scannable without expanding every type.
  const baseDuration = durations[0]
  const baseRate = baseDuration !== undefined ? findRateRule(baseDuration)?.priceCentavos : undefined
  const disabledCount = rt.resources.filter((r) => !r.isActive).length
  const summaryParts: string[] = []
  if (baseRate !== undefined) {
    const per = isCourt ? '/hr' : `/${baseDuration}m`
    summaryParts.push(`${formatCentavos(baseRate)}${per} base rate`)
  }
  if (disabledCount > 0) summaryParts.push(`${disabledCount} disabled`)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className={`flex items-center justify-between gap-3 ${isOpen ? 'mb-4' : ''}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left"
        >
          <ChevronIcon
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
          />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{rt.name}</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">{pluralize(rt.resources.length, 'resource')}</span>
          {!isOpen && summaryParts.length > 0 && (
            <span className="ml-auto truncate text-xs text-gray-500 dark:text-gray-400">{summaryParts.join(' · ')}</span>
          )}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="mb-5 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {rt.resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-900 dark:text-gray-100">{resource.label}</span>
                  {!resource.isActive && resource.disabledReason === 'bulletin' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Disabled by announcement</span>
                  )}
                  {!resource.isActive && resource.disabledNote && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{resource.disabledNote}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      resource.isActive
                        ? /* Active badge: dark-only muted-green pairing is a deliberate exception, not the sitewide neutral-pill convention */
                          'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {resource.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {resource.isActive ? (
                    <button
                      type="button"
                      onClick={() => setDisablingResource(resource)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnable(resource)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    {isCourt ? 'Rate' : 'Duration'}
                  </th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Base rate
                  </th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {durations.map((duration) => {
                  const rowLabel = isCourt ? 'Hourly rate' : durationLabel(duration)
                  const rule = findRateRule(duration)
                  return (
                    <tr key={duration} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{rowLabel}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        <PriceCell
                          price={rule?.priceCentavos}
                          allowed={isValidPricingRuleCombo(rt.slug, duration)}
                          addLabel={`Add ${rowLabel}`}
                          onAdd={() => openCreateRate(duration, rowLabel)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const fields = buildRateFields(duration)
                          return fields.length > 0 ? (
                            <ActionIconButton
                              label={`Edit ${rowLabel}`}
                              onClick={() => setEditingRow({ title: `Edit ${rowLabel}`, fields })}
                            />
                          ) : null
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="-mt-3 mb-5 text-xs text-gray-500 dark:text-gray-400">
            Members pay these base rates less their tier discount ({tierDiscountSummary}). The
            discount is fixed in code, not editable here.
          </p>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Add-on
                  </th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Member
                  </th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Non-Member
                  </th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isCourt ? (
                  <>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">Coaching (1 pax)</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        <PriceCell
                          price={findCoaching('member', 1)}
                          allowed={isValidAddOnPricingRuleCombo('coaching_fee', rt.slug, 'member', 1)}
                          addLabel="Add Coaching (1 pax) member rate"
                          onAdd={() => openCreateCoaching('member', 1, 'Coaching (1 pax)')}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        <PriceCell
                          price={findCoaching('non_member', 1)}
                          allowed={isValidAddOnPricingRuleCombo('coaching_fee', rt.slug, 'non_member', 1)}
                          addLabel="Add Coaching (1 pax) non-member rate"
                          onAdd={() => openCreateCoaching('non_member', 1, 'Coaching (1 pax)')}
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
                          ) : null
                        })()}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">Coaching (2 pax)</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        <PriceCell
                          price={findCoaching('member', 2)}
                          allowed={isValidAddOnPricingRuleCombo('coaching_fee', rt.slug, 'member', 2)}
                          addLabel="Add Coaching (2 pax) member rate"
                          onAdd={() => openCreateCoaching('member', 2, 'Coaching (2 pax)')}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        <PriceCell
                          price={findCoaching('non_member', 2)}
                          allowed={isValidAddOnPricingRuleCombo('coaching_fee', rt.slug, 'non_member', 2)}
                          addLabel="Add Coaching (2 pax) non-member rate"
                          onAdd={() => openCreateCoaching('non_member', 2, 'Coaching (2 pax)')}
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
                          ) : null
                        })()}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr className="last:border-b-0">
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">Coaching</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                      <PriceCell
                        price={findCoaching('member', null)}
                        allowed={isValidAddOnPricingRuleCombo('coaching_fee', rt.slug, 'member', null)}
                        addLabel="Add Coaching member rate"
                        onAdd={() => openCreateCoaching('member', null, 'Coaching')}
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                      <PriceCell
                        price={findCoaching('non_member', null)}
                        allowed={isValidAddOnPricingRuleCombo('coaching_fee', rt.slug, 'non_member', null)}
                        addLabel="Add Coaching non-member rate"
                        onAdd={() => openCreateCoaching('non_member', null, 'Coaching')}
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
                        ) : null
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
      <PriceEditModal
        isOpen={creatingCell !== null}
        onClose={() => setCreatingCell(null)}
        title={creatingCell?.title ?? ''}
        createField={creatingCell?.createField}
      />
      <ConfirmModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => pendingAction?.onConfirm()}
        title={pendingAction?.title ?? ''}
        message={pendingAction?.message ?? ''}
        confirmLabel={pendingAction?.confirmLabel}
        confirmVariant={pendingAction?.confirmVariant}
      />
    </div>
  )
}

interface ResourcesTabsProps {
  courts: ResourceTypeWithRelations[]
  simulators: ResourceTypeWithRelations[]
  guestFeeRule: GuestFeeRule | null
  addOnServices: AddOnService[]
}

export default function ResourcesTabs({ courts, simulators, guestFeeRule, addOnServices }: ResourcesTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('courts')
  const idPrefix = useId()
  const [editingGuestFee, setEditingGuestFee] = useState(false)

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: 'courts', label: 'Courts' },
    { key: 'simulators', label: 'Simulators' },
    { key: 'guestFee', label: 'Non-Member Guest Fee' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminTabs
        items={TAB_ITEMS}
        value={activeTab}
        onChange={setActiveTab}
        label="Resource types"
        idPrefix={idPrefix}
        className="mb-4"
      />

      <AdminTabPanel idPrefix={idPrefix} tabKey={activeTab} className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'courts' && (
          <div className="space-y-6">
            {courts.map((rt, index) => (
              <ResourceTypeCard key={rt.id} rt={rt} addOnServices={addOnServices} defaultOpen={index === 0} />
            ))}
          </div>
        )}

        {activeTab === 'simulators' && (
          <div className="space-y-6">
            {simulators.map((rt, index) => (
              <ResourceTypeCard key={rt.id} rt={rt} addOnServices={addOnServices} defaultOpen={index === 0} />
            ))}
          </div>
        )}

        {activeTab === 'guestFee' && guestFeeRule && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Non-Member Guest Fee</h2>
              <ActionIconButton
                label="Edit Non-Member Guest Fee"
                onClick={() => setEditingGuestFee(true)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Fee per additional non-member guest</span>
              <span className="text-right font-medium text-gray-900 dark:text-gray-100">
                {formatCentavos(guestFeeRule.amountCentavos)}/non-member guest
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Applies only to non-member guests, on every booking (courts and simulators, member or
              non-member booker), regardless of duration; the booker is exempt from their own guest
              fee. A member may add up to 7 non-member guests, a non-member up to 3. A guest who is
              themself a Winston member is free, uncapped, and never logged on the booking — staff
              verify their membership in person at check-in.
            </p>
            <PriceEditModal
              isOpen={editingGuestFee}
              onClose={() => setEditingGuestFee(false)}
              title="Edit Non-Member Guest Fee"
              fields={[
                {
                  key: 'amount',
                  label: 'Guest fee (per non-member guest)',
                  endpoint: `/api/admin/guest-fee-rule/${guestFeeRule.id}`,
                  bodyKey: 'amountCentavos',
                  currentCentavos: guestFeeRule.amountCentavos,
                },
              ]}
            />
          </div>
        )}
      </AdminTabPanel>
    </div>
  )
}
