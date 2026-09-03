import type { ResourceTypeSlug, RateTier, AddOnServiceSlug } from '@prisma/client'

/**
 * Which (resourceType, rateTier, durationMinutes) combinations a PricingRule may exist for —
 * see PROJECT_CONTEXT.md → Pricing. Court rates are hourly-flat (60 only); golf-sim's 30-minute
 * tier is member-only, no other resource type has an asymmetric tier list.
 */
export const VALID_PRICING_RULE_DURATIONS: Record<ResourceTypeSlug, Partial<Record<RateTier, number[]>>> = {
  tennis_court: { member: [60], non_member: [60] },
  pickleball_court: { member: [60], non_member: [60] },
  tennis_sim: { member: [15, 30, 60], non_member: [15, 30, 60] },
  pickleball_sim: { member: [15, 30, 60], non_member: [15, 30, 60] },
  golf_sim: { member: [30, 60, 90], non_member: [60, 90] },
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
  tennis_court: { member: [1, 2], non_member: [1, 2] },
  pickleball_court: { member: [1, 2], non_member: [1, 2] },
  tennis_sim: { member: [null] },
  pickleball_sim: { member: [null] },
  golf_sim: { member: [null], non_member: [null] },
}

/**
 * Which (resourceType, rateTier) combinations the "ball_boy" AddOnPricingRule may exist for —
 * court-only, doesn't apply to any simulator resource type. paxCount is always null for ball boy.
 */
export const VALID_BALL_BOY_RESOURCE_TYPES: Partial<Record<ResourceTypeSlug, RateTier[]>> = {
  tennis_court: ['member', 'non_member'],
  pickleball_court: ['member', 'non_member'],
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
  if (addOnServiceSlug === 'ball_boy') {
    return paxCount === null && (VALID_BALL_BOY_RESOURCE_TYPES[resourceTypeSlug]?.includes(rateTier) ?? false)
  }
  return false
}
