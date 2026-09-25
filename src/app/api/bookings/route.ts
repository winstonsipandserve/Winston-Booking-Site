import { Booking, Membership, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { HOLD_MINUTES } from '@/lib/booking-hold'
import { isWithinBusinessHours } from '@/lib/business-hours'
import { expirePaymongoCheckoutSession } from '@/lib/paymongo'
import {
  HOURLY_DURATION_CAP_ERROR,
  HOURLY_DURATION_MULTIPLE_ERROR,
  priceBooking,
} from '@/lib/booking-pricing'
import {
  MAX_HOURLY_DURATION_MINUTES,
  NON_MEMBER_ADVANCE_BOOKING_DAYS,
  isHourlyCategory,
  maxNonMemberGuestsForRateTier,
} from '@/lib/booking-limits'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { manilaCalendarDaysBetween } from '@/lib/manila-date'
import {
  consumeHoldCreationAttempt,
  hasReachedLiveHoldCap,
  identifyHoldClient,
  lockHoldClient,
} from '@/lib/booking-hold-abuse'
import { getMembershipActiveAt } from '@/lib/membership-current'
import {
  birthdayPerkEligible,
  getBirthdayPerkStatus,
  getGuestPassStatus,
  type BirthdayPerkKind,
} from '@/lib/member-perks'
import { sendBookingConfirmationEmailForBooking } from '@/lib/booking-confirmation'
import { appendBookingAccessCookie, createBookingAccessToken } from '@/lib/booking-access'
import { getActiveMemberSession } from '@/lib/member-session'

interface BookingRequestBody {
  resourceId?: unknown
  startTime?: unknown
  durationMinutes?: unknown
  guestCount?: unknown
  coaching?: unknown
  coachingPaxCount?: unknown
  /** Members only; default true. Untick in the wizard to save passes for another booking. */
  useGuestPasses?: unknown
  /** Members only; default true. Untick in the wizard to save the birthday hour. */
  useBirthdayPerk?: unknown
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Thrown inside the booking transaction to roll it back when the client has too many live holds. */
class LiveHoldCapError extends Error {}

/** Thrown inside the booking transaction when a perk priced before the lock is no longer available. */
class PerkConflictError extends Error {}

const PERK_CONFLICT_ERROR =
  'Your guest passes or birthday hour were just used by another booking. Please review the price and try again.'

const HOLD_LIMIT_ERROR =
  'Too many booking attempts. Complete or wait for your pending bookings to expire, then try again.'

function isExclusionViolation(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const message = err.message ?? ''
    return message.includes('booking_no_overlap') || message.includes('exclusion constraint')
  }
  return false
}

export async function POST(request: Request) {
  // A deleted customer or a token revoked by a password change yields null here, and the
  // request proceeds as anonymous — the same thing /book renders for that browser.
  const memberSession = await getActiveMemberSession()
  const isMemberSession = memberSession !== null

  let body: BookingRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { resourceId, startTime, durationMinutes } = body
  const guestCountRaw = body.guestCount ?? 0
  const coachingRaw = body.coaching ?? false
  const useGuestPassesRaw = body.useGuestPasses ?? true
  const useBirthdayPerkRaw = body.useBirthdayPerk ?? true

  if (
    !isNonEmptyString(resourceId) ||
    !isNonEmptyString(startTime) ||
    typeof durationMinutes !== 'number' ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    typeof guestCountRaw !== 'number' ||
    !Number.isInteger(guestCountRaw) ||
    guestCountRaw < 0 ||
    typeof coachingRaw !== 'boolean' ||
    typeof useGuestPassesRaw !== 'boolean' ||
    typeof useBirthdayPerkRaw !== 'boolean'
  ) {
    return Response.json({ error: 'Missing or malformed required fields' }, { status: 400 })
  }

  const coaching = coachingRaw

  const parsedStartTime = new Date(startTime)
  if (Number.isNaN(parsedStartTime.getTime())) {
    return Response.json({ error: 'startTime must be a valid ISO 8601 date' }, { status: 400 })
  }

  let customerId: string | null = null
  let isMember = false
  let activeMembership: Membership | null = null
  let customerNameSnapshot: string | null = null
  let customerPhoneSnapshot: string | null = null
  if (memberSession) {
    customerId = memberSession.customer.id
    // Member benefits require a membership whose term covers the slot itself, not just the
    // moment of booking — a member two days from expiry gets non-member pricing for next
    // week (see docs/business.md → Membership perks).
    activeMembership = await getMembershipActiveAt(customerId, parsedStartTime)
    isMember = !!activeMembership
    customerNameSnapshot = memberSession.customer.name
    customerPhoneSnapshot = memberSession.customer.phone
  }

  const guestCount = guestCountRaw
  // Every member benefit follows the term covering the slot (docs/business.md → Membership):
  // the tier discount, the guest cap, and the advance-booking window. The anonymous path
  // never has one, so it is always held to the non-member rules.
  const tierPlan = activeMembership ? MEMBERSHIP_TIER_PLANS[activeMembership.tier] : null
  const bookingDiscountPercent = tierPlan?.bookingDiscountPercent ?? 0

  const maxGuests = maxNonMemberGuestsForRateTier(isMember ? 'member' : 'non_member')
  if (guestCount > maxGuests) {
    return Response.json(
      { error: `Up to ${maxGuests} non-member guests can be added to this booking` },
      { status: 400 },
    )
  }

  // Advance window: today (Manila) plus N calendar days. A date the member's term does not
  // cover falls back to the non-member window (docs/business.md → Advance booking window).
  const advanceBookingDays = tierPlan?.advanceBookingDays ?? NON_MEMBER_ADVANCE_BOOKING_DAYS
  if (manilaCalendarDaysBetween(new Date(), parsedStartTime) > advanceBookingDays) {
    return Response.json(
      { error: `Bookings can be made up to ${advanceBookingDays} days in advance` },
      { status: 400 },
    )
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { resourceType: true },
    relationLoadStrategy: 'query',
  })
  if (!resource || !resource.isActive) {
    return Response.json({ error: 'Resource not found' }, { status: 400 })
  }
  const { resourceType } = resource
  const isCourt = resourceType.category === 'court'
  const isHourly = isHourlyCategory(resourceType.category)

  let coachingPaxCount: number | null = null
  if (coaching && isCourt) {
    const coachingPaxCountRaw = body.coachingPaxCount
    if (coachingPaxCountRaw !== 1 && coachingPaxCountRaw !== 2) {
      return Response.json(
        { error: 'coachingPaxCount must be 1 or 2 for court coaching' },
        { status: 400 },
      )
    }
    coachingPaxCount = coachingPaxCountRaw
  }

  if (isHourly && durationMinutes % 60 !== 0) {
    return Response.json({ error: HOURLY_DURATION_MULTIPLE_ERROR }, { status: 400 })
  }
  if (isHourly && durationMinutes > MAX_HOURLY_DURATION_MINUTES) {
    return Response.json({ error: HOURLY_DURATION_CAP_ERROR }, { status: 400 })
  }

  const endTime = new Date(parsedStartTime.getTime() + durationMinutes * 60000)

  if (!isWithinBusinessHours(parsedStartTime, endTime)) {
    return Response.json(
      { error: 'Bookings must start and end between 6:00 AM and 10:00 PM' },
      { status: 400 },
    )
  }

  // Mirrors the wizard, which disables any slot whose start is not in the future. Without
  // this a lapsed member could book a slot inside their expired term and spend forfeited
  // credit, and anyone could write past-dated rows.
  if (parsedStartTime <= new Date()) {
    return Response.json({ error: 'Bookings must start in the future' }, { status: 400 })
  }

  // Hold-spam controls (docs/features.md → Booking hold limits). Counted only for requests
  // that passed validation, so malformed traffic cannot burn a real customer's budget.
  const holdClient = identifyHoldClient(request, customerId)
  if (!(await consumeHoldCreationAttempt(holdClient))) {
    return Response.json({ error: HOLD_LIMIT_ERROR }, { status: 429 })
  }

  // Per-term perks (docs/business.md → Guest passes / Birthday-month court hour), applied by
  // default and declined per booking. Priced here from a first read; the transaction below
  // re-checks both under the per-client lock so two holds cannot spend the same allowance.
  let guestPassesUsed = 0
  let birthdayPerk: BirthdayPerkKind | null = null
  if (activeMembership && memberSession) {
    if (useGuestPassesRaw && guestCount > 0) {
      const passes = await getGuestPassStatus(prisma, activeMembership)
      guestPassesUsed = Math.min(guestCount, passes.remaining)
    }
    if (useBirthdayPerkRaw) {
      const birthday = await getBirthdayPerkStatus(prisma, activeMembership, memberSession.customer.dateOfBirth)
      if (birthdayPerkEligible(birthday, parsedStartTime, durationMinutes, resourceType.category)) {
        birthdayPerk = birthday.kind
      }
    }
  }

  const priceResult = await priceBooking({
    resourceTypeId: resourceType.id,
    category: resourceType.category,
    durationMinutes,
    guestCount,
    coaching,
    coachingPaxCount,
    isMember,
    bookingDiscountPercent,
    guestPassesUsed,
    birthdayPerk,
  })
  if ('error' in priceResult) {
    return Response.json({ error: priceResult.error }, { status: priceResult.status })
  }
  const {
    totalAmountCentavos,
    memberDiscountCentavos,
    guestFeeCentavos,
    addOns: selectedAddOns,
    addOnsTotalCentavos,
  } = priceResult
  const grandTotalCentavos = totalAmountCentavos + addOnsTotalCentavos
  const bookingAccessToken = isMemberSession ? null : createBookingAccessToken()

  let checkoutSessionIdsToExpire: string[] = []
  let txResult: { booking: Booking; creditCovered: boolean }
  try {
    txResult = await prisma.$transaction(async (tx) => {
      // Serialise hold creation per client so parallel requests cannot all pass the cap.
      await lockHoldClient(tx, holdClient.clientHash)

      // Re-check the perks priced above now that this client's holds are serialised.
      if (activeMembership && (guestPassesUsed > 0 || birthdayPerk)) {
        if (guestPassesUsed > 0) {
          const passes = await getGuestPassStatus(tx, activeMembership)
          if (passes.remaining < guestPassesUsed) throw new PerkConflictError()
        }
        if (birthdayPerk) {
          const birthday = await getBirthdayPerkStatus(tx, activeMembership, memberSession?.customer.dateOfBirth ?? null)
          if (birthday.used) throw new PerkConflictError()
        }
      }

      const holdCutoff = new Date(Date.now() - HOLD_MINUTES * 60000)
      const staleBookings = await tx.booking.findMany({
        where: {
          resourceId: resource.id,
          status: 'pending_payment',
          createdAt: { lt: holdCutoff },
          startTime: { lt: endTime },
          endTime: { gt: parsedStartTime },
        },
        include: { payment: true },
        relationLoadStrategy: 'query',
      })

      if (staleBookings.length > 0) {
        const staleBookingIds = staleBookings.map((b) => b.id)
        await tx.booking.updateMany({
          where: { id: { in: staleBookingIds } },
          data: { status: 'cancelled' },
        })
        await tx.payment.updateMany({
          where: { bookingId: { in: staleBookingIds } },
          data: { status: 'failed' },
        })
        checkoutSessionIdsToExpire = staleBookings
          .filter((b) => b.payment?.status === 'pending' && b.payment.paymongoCheckoutSessionId != null)
          .map((b) => b.payment!.paymongoCheckoutSessionId!)
      }

      // If this is a member booking and their credit balance fully covers the grand
      // total, atomically decrement it and confirm the booking immediately — no
      // PayMongo checkout needed. A ₱0 total (a free birthday hour with every guest on a
      // pass) takes this same path with nothing to decrement, so it confirms at once
      // instead of opening a ₱0 checkout. The `gte` filter inside updateMany (not a separate
      // findUnique-then-update) is what makes this concurrency-safe: if two bookings
      // race for the same balance, only one update can match once the first has
      // already decremented it below the threshold.
      let creditCovered = false
      if (
        isMember &&
        activeMembership &&
        activeMembership.creditBalanceCentavos >= grandTotalCentavos
      ) {
        // The term filter is re-applied here so the redemption can never land on a row
        // that stopped covering the slot between the lookup above and this write.
        const decrement = await tx.membership.updateMany({
          where: {
            id: activeMembership.id,
            creditBalanceCentavos: { gte: grandTotalCentavos },
            startDate: { lte: parsedStartTime },
            endDate: { gte: parsedStartTime },
          },
          data: { creditBalanceCentavos: { decrement: grandTotalCentavos } },
        })
        creditCovered = decrement.count === 1
      }

      // A credit-covered booking confirms immediately and never occupies a hold, so the
      // cap only applies when this row will sit in pending_payment. Throwing here rolls
      // back the credit decrement above along with everything else.
      if (!creditCovered && (await hasReachedLiveHoldCap(tx, holdClient.clientHash, new Date()))) {
        throw new LiveHoldCapError()
      }

      const createdBooking = await tx.booking.create({
        data: {
          customerId,
          resourceId: resource.id,
          startTime: parsedStartTime,
          endTime,
          status: creditCovered ? 'confirmed' : 'pending_payment',
          guestCount,
          totalAmountCentavos,
          memberDiscountCentavos,
          guestFeeAmountCentavos: guestFeeCentavos,
          guestPassesUsed,
          birthdayPerkApplied: birthdayPerk !== null,
          customerNameSnapshot,
          customerPhoneSnapshot,
          accessTokenHash: bookingAccessToken?.tokenHash,
          accessTokenExpiresAt: bookingAccessToken?.expiresAt,
          holdClientHash: holdClient.clientHash,
        },
      })

      if (selectedAddOns.length > 0) {
        await tx.bookingAddOn.createMany({
          data: selectedAddOns.map((addOn) => ({
            bookingId: createdBooking.id,
            addOnServiceId: addOn.addOnServiceId,
            addOnPricingRuleId: addOn.addOnPricingRuleId,
            quantity: 1,
            amountCentavos: addOn.amountCentavos,
          })),
        })
      }

      if (creditCovered && activeMembership) {
        await tx.payment.create({
          data: {
            bookingId: createdBooking.id,
            amountCentavos: grandTotalCentavos,
            status: 'paid',
            method: 'membership_credit',
            paidAt: new Date(),
          },
        })
        // No ledger row for a ₱0 booking — nothing moved.
        if (grandTotalCentavos > 0) {
          await tx.membershipCreditTransaction.create({
            data: {
              membershipId: activeMembership.id,
              bookingId: createdBooking.id,
              amountCentavos: -grandTotalCentavos,
              reason: 'booking_redemption',
            },
          })
        }
      }

      return { booking: createdBooking, creditCovered }
    }, { timeout: 15000 })
  } catch (err) {
    if (err instanceof LiveHoldCapError) {
      return Response.json({ error: HOLD_LIMIT_ERROR }, { status: 429 })
    }
    if (err instanceof PerkConflictError) {
      return Response.json({ error: PERK_CONFLICT_ERROR }, { status: 409 })
    }
    console.error('Booking creation failed', err)
    if (isExclusionViolation(err)) {
      return Response.json({ error: 'Slot unavailable' }, { status: 409 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  const { booking, creditCovered } = txResult

  for (const checkoutSessionId of checkoutSessionIdsToExpire) {
    await expirePaymongoCheckoutSession(checkoutSessionId)
  }

  if (creditCovered && activeMembership) {
    await sendBookingConfirmationEmailForBooking(
      booking.id,
      grandTotalCentavos > 0
        ? {
            amountCentavos: grandTotalCentavos,
            remainingBalanceCentavos: activeMembership.creditBalanceCentavos - grandTotalCentavos,
          }
        : undefined,
    )
  }

  const holdExpiresAt = new Date(booking.createdAt.getTime() + HOLD_MINUTES * 60000)

  const response = Response.json(
    {
      id: booking.id,
      status: booking.status,
      resourceId: booking.resourceId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmountCentavos: booking.totalAmountCentavos,
      holdExpiresAt,
      addOns: selectedAddOns.map((addOn) => ({
        service: addOn.service,
        paxCount: addOn.paxCount,
        amountCentavos: addOn.amountCentavos,
      })),
      addOnsTotalCentavos,
      customerAttached: isMemberSession,
      isMember,
      creditCovered,
    },
    { status: 201 },
  )
  return bookingAccessToken
    ? appendBookingAccessCookie(response, booking.id, bookingAccessToken.rawToken)
    : response
}
