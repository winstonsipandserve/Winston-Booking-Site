import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Reveal from '@/components/ui/Reveal'
import AccountProfile from '@/components/account/AccountProfile'
import MembershipStatusCard from '@/components/account/MembershipStatusCard'
import RecentBookingsList, { type BookingListItem } from '@/components/account/RecentBookingsList'
import { formatBookingDateTime, formatMembershipTier } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { getOrCreateCheckInToken, generateQrCodeDataUrl } from '@/lib/check-in-token'
import { auth } from '../../../auth'

export default async function AccountPage() {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'member') {
    redirect('/login')
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
  })

  if (!customer) {
    redirect('/login')
  }

  const now = new Date()

  let membership = await prisma.membership.findFirst({
    where: { customerId: customer.id, status: 'active', endDate: { gte: now } },
    orderBy: { startDate: 'desc' },
  })

  if (!membership) {
    membership = await prisma.membership.findFirst({
      where: { customerId: customer.id },
      orderBy: { startDate: 'desc' },
    })
  }

  let membershipStatusProps:
    | { membership: null; customerId: string }
    | {
        membership: {
          tierName: string
          activationCentavos: number
          creditCentavos: number
          remainingCreditCentavos: number
          expiryDateLabel: string
          isExpired: boolean
        }
        customerId: string
        qrCodeDataUrl: string
      } = { membership: null, customerId: customer.id }

  if (membership) {
    const activationTransaction = await prisma.membershipCreditTransaction.findFirst({
      where: { membershipId: membership.id, reason: 'activation' },
      orderBy: { createdAt: 'asc' },
    })

    const creditCentavos = activationTransaction?.amountCentavos ?? membership.creditBalanceCentavos
    const isExpired = membership.endDate < now

    const checkInToken = await getOrCreateCheckInToken(customer.id)
    const qrCodeDataUrl = await generateQrCodeDataUrl(checkInToken)

    membershipStatusProps = {
      membership: {
        tierName: formatMembershipTier(membership.tier),
        activationCentavos: membership.activationFeeCentavos,
        creditCentavos,
        remainingCreditCentavos: membership.creditBalanceCentavos,
        expiryDateLabel: new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'Asia/Manila',
        }).format(membership.endDate),
        isExpired,
      },
      customerId: customer.id,
      qrCodeDataUrl,
    }
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
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

  const firstName = customer.name.split(' ')[0]

  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <p className="text-sm uppercase tracking-[0.3em] text-accent-light/90">Member Portal</p>
          <h1 className="mt-4 font-serif text-3xl text-brand-light md:text-4xl">
            Welcome back, {firstName}
          </h1>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[320px_1fr] md:px-10">
          <div className="flex flex-col gap-8">
            <Reveal className="h-full">
              <AccountProfile name={customer.name} email={customer.email} phone={customer.phone} />
            </Reveal>
          </div>

          <div className="flex flex-col gap-8">
            <Reveal delayMs={100}>
              <MembershipStatusCard {...membershipStatusProps} />
            </Reveal>
          </div>

          <div className="flex flex-col gap-8 md:col-span-2">
            <Reveal delayMs={200}>
              <RecentBookingsList bookings={bookingListItems} />
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
