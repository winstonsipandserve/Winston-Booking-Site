import type { ResourceTypeSlug, RateTier, AddOnServiceSlug } from '@prisma/client'

/**
 * Which (resourceType, rateTier, durationMinutes) combinations a PricingRule may exist for —
 * see docs/business.md → Pricing. Court rates are hourly-flat (60 only); tennis and pickleball
 * simulators offer 30 and 60 minutes; the golf simulator offers 60 minutes only.
 */
export const VALID_PRICING_RULE_DURATIONS: Record<ResourceTypeSlug, Partial<Record<RateTier, number[]>>> = {
  pickleball_court: { member: [60], non_member: [60] },
  tennis_sim: { member: [30, 60], non_member: [30, 60] },
  pickleball_sim: { member: [30, 60], non_member: [30, 60] },
  golf_sim: { member: [60], non_member: [60] },
}

export function isValidPricingRuleCombo(
  resourceTypeSlug: ResourceTypeSlug,
  rateTier: RateTier,
  durationMinutes: number,
): boolean {
  return VALID_PRICING_RULE_DURATIONS[resourceTypeSlug]?.[rateTier]?.includes(durationMinutes) ?? false
}

/**
 * Which (resourceType, rateTier, paxCount) combinations the "coaching_fee" AddOnPricingRule may
 * exist for. Courts have a 1-pax/2-pax tier; simulators have a single flat rate (paxCount null).
 * Non-member coaching is not offered at all on tennis-sim/pickleball-sim (no rate on the client
 * sheet) — deliberately asymmetric with golf-sim, which offers both tiers.
 */
export const VALID_COACHING_FEE_COMBOS: Record<ResourceTypeSlug, Partial<Record<RateTier, (number | null)[]>>> = {
  pickleball_court: { member: [1, 2], non_member: [1, 2] },
  tennis_sim: { member: [null] },
  pickleball_sim: { member: [null] },
  golf_sim: { member: [null], non_member: [null] },
}

export function isValidAddOnPricingRuleCombo(
  addOnServiceSlug: AddOnServiceSlug,
  resourceTypeSlug: ResourceTypeSlug,
  rateTier: RateTier,
  paxCount: number | null,
): boolean {
  if (addOnServiceSlug === 'coaching_fee') {
    return VALID_COACHING_FEE_COMBOS[resourceTypeSlug]?.[rateTier]?.includes(paxCount) ?? false
  }
  return false
}
