// Client-safe booking limits (no Prisma import). The server enforces these in
// POST /api/bookings; the wizard reads them so its options never exceed what the API accepts.

/**
 * Longest single hourly booking (courts and spaces). Simulators are already bounded by their
 * pricing tiers.
 */
export const MAX_HOURLY_DURATION_MINUTES = 240

type Category = 'court' | 'simulator' | 'space'

/**
 * Courts and spaces are booked in whole hours at a flat hourly rate (one 60-minute PricingRule
 * multiplied by the hours); simulators are booked in fixed duration tiers.
 */
export function isHourlyCategory(category: Category): boolean {
  return category !== 'simulator'
}

/**
 * Spaces (lounge, conference room) are a flat rate for everyone: no tier discount and no
 * birthday-month hour — see docs/business.md → Pricing.
 */
export function categoryHasMemberPricing(category: Category): boolean {
  return category !== 'space'
}

/** Hold creations allowed per client inside the shared 15-minute rate-limit window. */
export const HOLD_CREATIONS_PER_WINDOW = 10

/** Hold creations allowed per IP inside the window, applied on top of the member cap. */
export const HOLD_CREATIONS_PER_IP_PER_WINDOW = 20

/** Unpaid holds one client may have live at once. */
export const MAX_LIVE_HOLDS_PER_CLIENT = 3

/**
 * Additional non-member guests a MEMBER BOOKER may add when a membership term covers the slot.
 * There is no cap named for "member guests" — a guest who is themself a Winston member is free,
 * uncapped, and has no field at all — see docs/business.md → Guest Fee.
 */
export const MAX_NON_MEMBER_GUESTS_MEMBER_BOOKER = 7

/** Additional non-member guests on any other booking, including the anonymous path. */
export const MAX_NON_MEMBER_GUESTS_NON_MEMBER_BOOKER = 3

/**
 * How many days ahead a non-member may book: today (Manila) plus this many calendar days.
 * Members use MEMBERSHIP_TIER_PLANS[tier].advanceBookingDays for dates their term covers
 * (docs/business.md → Advance booking window).
 */
export const NON_MEMBER_ADVANCE_BOOKING_DAYS = 3

/** Non-member guest cap for a booker's rate tier — see docs/business.md → Guest Fee. */
export function maxNonMemberGuestsForRateTier(rateTier: 'member' | 'non_member'): number {
  return rateTier === 'member'
    ? MAX_NON_MEMBER_GUESTS_MEMBER_BOOKER
    : MAX_NON_MEMBER_GUESTS_NON_MEMBER_BOOKER
}
