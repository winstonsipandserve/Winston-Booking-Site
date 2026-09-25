import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AccountProfile from '@/components/account/AccountProfile'
import MembershipStatusCard from '@/components/account/MembershipStatusCard'
import RecentBookingsList, { type BookingListItem } from '@/components/account/RecentBookingsList'
import CreditActivityLog, { type CreditActivityItem } from '@/components/account/CreditActivityLog'
import { formatBookingDateTime, formatCentavos, formatMembershipExpiryDate, formatResourceName } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { getOrCreateCheckInToken, generateQrCodeDataUrl } from '@/lib/check-in-token'
import { buildMembershipDisplayFields } from '@/lib/membership-latest'
import { getBirthdayPerkStatus, getGuestPassStatus } from '@/lib/member-perks'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
import { getCurrentMembership, getRenewalEligibility } from '@/lib/membership-current'
import { getActiveMemberSession } from '@/lib/member-session'

export default async function AccountPage() {
  const memberSession = await getActiveMemberSession()
  if (!memberSession) {
    redirect('/login')
  }
  const { customer } = memberSession

  const membership = await getCurrentMembership(customer.id)

  let membershipStatusProps:
    | { membership: null; customerId: string }
    | {
        membership: {
          tierName: string
          isFounding: boolean
          bookingDiscountPercent: number
          guestPasses: number
          advanceBookingDays: number
          guestPassesRemaining: number
          birthdayMonthLabel: string | null
          birthdayPerkUsed: boolean
          remainingCreditCentavos: number
          expiryDateLabel: string
          isExpired: boolean
          canRenew: boolean
          scheduledRenewalExpiryLabel: string | null
        }
        customerId: string
        qrCodeDataUrl: string
        checkInCode: string
      } = { membership: null, customerId: customer.id }

  if (membership) {
    const displayFields = buildMembershipDisplayFields(membership)
    const [renewal, passes, birthday] = await Promise.all([
      getRenewalEligibility(customer.id),
      getGuestPassStatus(prisma, membership),
      getBirthdayPerkStatus(prisma, membership, customer.dateOfBirth),
    ])

    const { token: checkInToken, code: checkInCode } = await getOrCreateCheckInToken(customer.id)
    const qrCodeDataUrl = await generateQrCodeDataUrl(checkInToken)

    membershipStatusProps = {
      membership: {
        ...displayFields,
        guestPassesRemaining: passes.remaining,
        birthdayMonthLabel: birthday.birthdayMonth === null ? null : MONTH_NAMES[birthday.birthdayMonth - 1],
        birthdayPerkUsed: birthday.used,
        canRenew: renewal.eligible,
        scheduledRenewalExpiryLabel:
          !renewal.eligible && renewal.reason === 'already_scheduled'
            ? formatMembershipExpiryDate(renewal.current.endDate)
            : null,
      },
      customerId: customer.id,
      qrCodeDataUrl,
      checkInCode,
    }
  }

  // A cancelled row that was never paid is an abandoned hold — including one a stranger
  // created under this email — and has no place in the member's history.
  const bookings = await prisma.booking.findMany({
    where: {
      customerId: customer.id,
      OR: [{ status: { not: 'cancelled' } }, { payment: { is: { status: 'paid' } } }],
    },
    orderBy: { startTime: 'desc' },
    take: 50,
    include: { resource: { include: { resourceType: true } } },
    relationLoadStrategy: 'query',
  })

  const bookingListItems: BookingListItem[] = bookings.map((booking) => ({
    id: booking.id,
    resourceTypeName: booking.resource.resourceType.name,
    resourceLabel: booking.resource.label,
    dateLabel: formatBookingDateTime(booking.startTime),
    status: booking.status,
  }))

  // The ledger is scoped to the same term the status card shows, so its entries sum to the
  // balance displayed above it. Redemptions carry their booking so the member can see what
  // the credit paid for.
  const creditTransactions = membership
    ? await prisma.membershipCreditTransaction.findMany({
        where: { membershipId: membership.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          booking: { include: { resource: { include: { resourceType: true } } } },
        },
        relationLoadStrategy: 'query',
      })
    : []

  const creditActivityItems: CreditActivityItem[] = creditTransactions.map((tx) => ({
    id: tx.id,
    reason: tx.reason,
    amountCentavos: tx.amountCentavos,
    amountLabel: formatCentavos(Math.abs(tx.amountCentavos)),
    dateLabel: formatBookingDateTime(tx.createdAt),
    bookingLabel: tx.booking
      ? `${formatResourceName(tx.booking.resource.resourceType.name, tx.booking.resource.label)} · ${formatBookingDateTime(tx.booking.startTime)}`
      : null,
  }))

  const firstName = customer.name.split(' ')[0]

  return (
    <>
      <Navbar />

      <section className="border-b border-gray-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-gray-500">Member Portal</p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">Welcome back, {firstName}</h1>
        </div>
      </section>

      <section className="bg-gray-50 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-6">
            <AccountProfile
              name={customer.name}
              email={customer.email}
              phone={customer.phone}
              memberSince={membership?.startDate ?? null}
            />
          </div>

          <div className="flex flex-col gap-6">
            <MembershipStatusCard {...membershipStatusProps} />
          </div>

          <div className="flex flex-col gap-6 md:col-span-2">
            {membership && <CreditActivityLog entries={creditActivityItems} />}
            <RecentBookingsList bookings={bookingListItems} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
