'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { TennisIcon, PickleballIcon, GolfIcon } from '@/components/ui/Icons'

type ResourceCategory = 'court' | 'simulator'

interface PricingRuleOption {
  rateTier: RateTier
  durationMinutes: number
  priceCentavos: number
}

interface ResourceTypeOption {
  id: string
  slug: string
  name: string
  category: ResourceCategory
  resources: { id: string; label: string }[]
  pricing: PricingRuleOption[]
}

type RateTier = 'member' | 'non_member'

interface SportStepProps {
  resourceTypes: ResourceTypeOption[]
  resourceTypeId: string
  onSelect: (resourceTypeId: string) => void
  rateTier: RateTier
}

function countLabel(count: number, category: ResourceCategory): string {
  const unit = category === 'court' ? 'Court' : 'Simulator'
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

const SPORT_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  tennis_court: TennisIcon,
  tennis_sim: TennisIcon,
  pickleball_court: PickleballIcon,
  pickleball_sim: PickleballIcon,
  golf_sim: GolfIcon,
}

interface PriceTier {
  label: string
  price: string
}

interface PricingInfo {
  tiers: PriceTier[]
}

function formatWholePesos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH')}`
}

function getPricingInfo(resourceType: ResourceTypeOption, rateTier: RateTier): PricingInfo | null {
  const rules = resourceType.pricing.filter((p) => p.rateTier === rateTier)
  if (rules.length === 0) return null

  if (resourceType.category === 'court') {
    const hourly = rules.find((p) => p.durationMinutes === 60)
    if (!hourly) return null
    return { tiers: [{ label: 'Per hour', price: formatWholePesos(hourly.priceCentavos) }] }
  }

  const tiers = [...rules]
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .map((p) => ({ label: `${p.durationMinutes} minutes`, price: formatWholePesos(p.priceCentavos) }))
  return { tiers }
}

export default function SportStep({ resourceTypes, resourceTypeId, onSelect, rateTier }: SportStepProps) {
  const [pricingSlug, setPricingSlug] = useState<string | null>(null)
  const pricingResourceType = resourceTypes.find((rt) => rt.slug === pricingSlug) ?? null
  const pricingInfo = pricingResourceType ? getPricingInfo(pricingResourceType, rateTier) : null

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {resourceTypes.map((rt) => {
          const isSelected = rt.id === resourceTypeId
          const SportIcon = SPORT_ICONS[rt.slug]
          return (
            <div
              key={rt.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(rt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(rt.id)
                }
              }}
              className={`flex cursor-pointer flex-col items-start gap-1 rounded px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-2 border-accent-primary bg-accent-primary/10'
                  : 'border border-brand-dark/20 bg-brand-light hover:bg-brand-dark/5'
              }`}
            >
              {SportIcon && (
                <SportIcon
                  className={`h-6 w-6 ${isSelected ? 'text-accent-primary' : 'text-accent-primary/40'}`}
                />
              )}
              <span className={`text-brand-dark ${isSelected ? 'font-semibold' : 'font-medium'}`}>{rt.name}</span>
              <span className="text-sm text-brand-dark/60">
                {countLabel(rt.resources.length, rt.category)}
              </span>
              {getPricingInfo(rt, rateTier) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPricingSlug(rt.slug)
                  }}
                  className="mt-1 text-sm font-medium text-accent-primary underline underline-offset-2 transition-colors hover:text-accent-dark"
                >
                  View Pricing
                </button>
              )}
            </div>
          )
        })}
      </div>

      {pricingInfo && (
        <Modal
          isOpen={true}
          onClose={() => setPricingSlug(null)}
          title={`${pricingResourceType?.name ?? ''} Pricing`}
        >
          <ul className="flex flex-col divide-y divide-brand-dark/10">
            {pricingInfo.tiers.map((tier) => (
              <li key={tier.label} className="flex items-center justify-between py-2 text-sm text-brand-dark">
                <span>{tier.label}</span>
                <span className="font-semibold text-accent-primary">{tier.price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-brand-dark/50">
            {rateTier === 'member'
              ? 'Member rates shown.'
              : 'Non-member rates shown. Member pricing is applied automatically at checkout for active members.'}
          </p>
        </Modal>
      )}
    </>
  )
}
