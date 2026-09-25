import BookingPageClient from '@/components/booking/BookingPageClient'
import Navbar from '@/components/layout/Navbar'
import { getLiveMemberships, membershipCoversInstant } from '@/lib/membership-current'
import { manilaDateKey } from '@/lib/manila-date'
import { prisma } from '@/lib/prisma'
import { activeAnnouncementWhere, sortAnnouncementsByUrgency } from '@/lib/announcement'
import { formatBookingDateTime, formatMembershipExpiryDate } from '@/lib/format'
import type { GateNotice } from '@/components/booking/AnnouncementGate'
import type { MemberContext } from '@/components/booking/BookingPageClient'
import { getActiveMemberSession } from '@/lib/member-session'
import { MEMBERSHIP_TIER_PLANS } from '@/lib/membership-pricing'
import { getBirthdayPerkStatus, getGuestPassStatus } from '@/lib/member-perks'

export default async function BookPage() {
  const now = new Date()
  const [memberSession, announcements] = await Promise.all([
    getActiveMemberSession(),
    prisma.announcement.findMany({
      where: activeAnnouncementWhere(now),
      include: { resourceLinks: { include: { resource: { include: { resourceType: true } } } } },
    }),
  ])

  const notices: GateNotice[] = sortAnnouncementsByUrgency(announcements).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    urgency: announcement.urgency,
    upcoming: announcement.startAt > now,
    startAt: formatBookingDateTime(announcement.startAt),
    endAt: announcement.endAt ? formatBookingDateTime(announcement.endAt) : null,
    affectedResources: announcement.resourceLinks.map(
      (link) => `${link.resource.resourceType.name} — ${link.resource.label}`,
    ),
  }))

  let memberContext: MemberContext | null = null

  if (memberSession) {
    const { customer } = memberSession
    {
      // Every unexpired term (current plus a scheduled renewal) so the wizard can price a
      // slot by the term that actually covers it — the API applies the same rule.
      const liveMemberships = await getLiveMemberships(customer.id, now)
      const activeNow = liveMemberships.find((membership) => membershipCoversInstant(membership, now))
      memberContext = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isActiveMember: !!activeNow,
        creditBalanceCentavos: activeNow?.creditBalanceCentavos ?? 0,
        coverage: await Promise.all(
          liveMemberships.map(async (membership) => {
            const [passes, birthday] = await Promise.all([
              getGuestPassStatus(prisma, membership, now),
              getBirthdayPerkStatus(prisma, membership, customer.dateOfBirth, now),
            ])
            return {
              startsAt: membership.startDate.toISOString(),
              endsAt: membership.endDate.toISOString(),
              startDateKey: manilaDateKey(membership.startDate),
              expiryDateKey: manilaDateKey(membership.endDate),
              expiryDateLabel: formatMembershipExpiryDate(membership.endDate),
              creditBalanceCentavos: membership.creditBalanceCentavos,
              tierName: MEMBERSHIP_TIER_PLANS[membership.tier].name,
              bookingDiscountPercent: MEMBERSHIP_TIER_PLANS[membership.tier].bookingDiscountPercent,
              advanceBookingDays: MEMBERSHIP_TIER_PLANS[membership.tier].advanceBookingDays,
              guestPassesRemaining: passes.remaining,
              guestPassAllowance: passes.allowance,
              birthdayPerk: { month: birthday.birthdayMonth, kind: birthday.kind, used: birthday.used },
            }
          }),
        ),
      }
    }
  }

  return (
    <>
      <Navbar />

      <BookingPageClient memberContext={memberContext} notices={notices} />
    </>
  )
}
