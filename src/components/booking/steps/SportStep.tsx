'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

type ResourceCategory = 'court' | 'simulator'

interface ResourceTypeOption {
  id: string
  slug: string
  name: string
  category: ResourceCategory
  resources: { id: string; label: string }[]
}

interface SportStepProps {
  resourceTypes: ResourceTypeOption[]
  resourceTypeId: string
  onSelect: (resourceTypeId: string) => void
}

function countLabel(count: number, category: ResourceCategory): string {
  const unit = category === 'court' ? 'Court' : 'Simulator'
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

interface PriceTier {
  label: string
  price: string
}

interface PricingInfo {
  tiers: PriceTier[]
}

const NON_MEMBER_PRICING: Record<string, PricingInfo> = {
  tennis_court: { tiers: [{ label: 'Per hour', price: '₱750' }] },
  pickleball_court: { tiers: [{ label: 'Per hour', price: '₱650' }] },
  tennis_sim: {
    tiers: [
      { label: '15 minutes', price: '₱300' },
      { label: '30 minutes', price: '₱450' },
      { label: '60 minutes', price: '₱800' },
    ],
  },
  pickleball_sim: {
    tiers: [
      { label: '15 minutes', price: '₱300' },
      { label: '30 minutes', price: '₱450' },
      { label: '60 minutes', price: '₱800' },
    ],
  },
  golf_sim: {
    tiers: [
      { label: '60 minutes', price: '₱1,150' },
      { label: '90 minutes', price: '₱1,450' },
    ],
  },
}

export default function SportStep({ resourceTypes, resourceTypeId, onSelect }: SportStepProps) {
  const [pricingSlug, setPricingSlug] = useState<string | null>(null)

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {resourceTypes.map((rt) => {
          const isSelected = rt.id === resourceTypeId
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
              <span className={`text-brand-dark ${isSelected ? 'font-semibold' : 'font-medium'}`}>{rt.name}</span>
              <span className="text-sm text-brand-dark/60">
                {countLabel(rt.resources.length, rt.category)}
              </span>
              {NON_MEMBER_PRICING[rt.slug] && (
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

      {pricingSlug && NON_MEMBER_PRICING[pricingSlug] && (
        <Modal
          isOpen={true}
          onClose={() => setPricingSlug(null)}
          title={`${resourceTypes.find((rt) => rt.slug === pricingSlug)?.name ?? ''} Pricing`}
        >
          <ul className="flex flex-col divide-y divide-brand-dark/10">
            {NON_MEMBER_PRICING[pricingSlug].tiers.map((tier) => (
              <li key={tier.label} className="flex items-center justify-between py-2 text-sm text-brand-dark">
                <span>{tier.label}</span>
                <span className="font-semibold text-accent-primary">{tier.price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-brand-dark/50">
            Non-member rates shown. Member pricing is applied automatically at checkout for active members.
          </p>
        </Modal>
      )}
    </>
  )
}
