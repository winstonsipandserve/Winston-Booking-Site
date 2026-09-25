'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { TennisIcon, PickleballIcon, GolfIcon } from '@/components/ui/Icons'
import { tierDiscountCentavos } from '@/lib/membership-pricing'

type ResourceCategory = 'court' | 'simulator'

interface PricingRuleOption {
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
  /** Tier discount off the base rate for the slot being built; 0 for non-members. */
  discountPercent: number
}

function countLabel(count: number, category: ResourceCategory): string {
  const unit = category === 'court' ? 'Court' : 'Simulator'
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

const SPORT_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  tennis_sim: TennisIcon,
  pickleball_court: PickleballIcon,
  pickleball_sim: PickleballIcon,
  golf_sim: GolfIcon,
}

interface PriceTier {
  label: string
  price: string
  /** Discounted price when a tier discount applies. */
  memberPrice: string | null
}

interface PricingInfo {
  tiers: PriceTier[]
}

function formatWholePesos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH')}`
}

function getPricingInfo(resourceType: ResourceTypeOption, discountPercent: number): PricingInfo | null {
  const rules = resourceType.pricing
  if (rules.length === 0) return null

  const memberPrice = (centavos: number) =>
    discountPercent > 0 ? formatWholePesos(centavos - tierDiscountCentavos(centavos, discountPercent)) : null

  if (resourceType.category === 'court') {
    const hourly = rules.find((p) => p.durationMinutes === 60)
    if (!hourly) return null
    return {
      tiers: [
        { label: 'Per hour', price: formatWholePesos(hourly.priceCentavos), memberPrice: memberPrice(hourly.priceCentavos) },
      ],
    }
  }

  const tiers = [...rules]
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .map((p) => ({
      label: `${p.durationMinutes} minutes`,
      price: formatWholePesos(p.priceCentavos),
      memberPrice: memberPrice(p.priceCentavos),
    }))
  return { tiers }
}

export default function SportStep({ resourceTypes, resourceTypeId, onSelect, rateTier, discountPercent }: SportStepProps) {
  const [pricingSlug, setPricingSlug] = useState<string | null>(null)
  const pricingResourceType = resourceTypes.find((rt) => rt.slug === pricingSlug) ?? null
  const pricingInfo = pricingResourceType ? getPricingInfo(pricingResourceType, discountPercent) : null

  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Sport</h2>
      <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
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
              className={`flex cursor-pointer flex-col items-start gap-1 rounded-md px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-2 border-gray-900 bg-gray-50'
                  : 'border border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {SportIcon && (
                <SportIcon className={`h-6 w-6 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`} />
              )}
              <span className={`text-gray-900 ${isSelected ? 'font-semibold' : 'font-medium'}`}>{rt.name}</span>
              <span className="text-sm text-gray-500">
                {countLabel(rt.resources.length, rt.category)}
              </span>
              {getPricingInfo(rt, discountPercent) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPricingSlug(rt.slug)
                  }}
                  className="mt-1 text-sm font-medium text-gray-700 underline underline-offset-2 transition-colors hover:text-gray-900"
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
          <ul className="flex flex-col divide-y divide-gray-200">
            {pricingInfo.tiers.map((tier) => (
              <li key={tier.label} className="flex items-center justify-between py-2 text-sm text-gray-900">
                <span>{tier.label}</span>
                {tier.memberPrice ? (
                  <span className="font-semibold text-gray-900">
                    <span className="mr-2 font-normal text-gray-400 line-through">{tier.price}</span>
                    {tier.memberPrice}
                  </span>
                ) : (
                  <span className="font-semibold text-gray-900">{tier.price}</span>
                )}
              </li>
            ))}
          </ul>
          {rateTier === 'member' && discountPercent > 0 && (
            <p className="mt-3 text-xs text-gray-400">Your {discountPercent}% member discount is applied.</p>
          )}
        </Modal>
      )}
    </div>
  )
}
