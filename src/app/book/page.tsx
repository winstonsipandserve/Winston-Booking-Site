import BookingPageClient from '@/components/booking/BookingPageClient'
import Navbar from '@/components/layout/Navbar'
import { getActiveMembership } from '@/lib/customer-resolution'
import { prisma } from '@/lib/prisma'
import { activeAnnouncementWhere, sortAnnouncementsByUrgency } from '@/lib/announcement'
import { formatBookingDateTime } from '@/lib/format'
import type { GateNotice } from '@/components/booking/AnnouncementGate'
import { auth } from '../../../auth'

export default async function BookPage() {
  const [session, announcements] = await Promise.all([
    auth(),
    prisma.announcement.findMany({
      where: activeAnnouncementWhere(),
      include: { resourceLinks: { include: { resource: { include: { resourceType: true } } } } },
    }),
  ])

  const notices: GateNotice[] = sortAnnouncementsByUrgency(announcements).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    urgency: announcement.urgency,
    startAt: formatBookingDateTime(announcement.startAt),
    endAt: announcement.endAt ? formatBookingDateTime(announcement.endAt) : null,
    affectedResources: announcement.resourceLinks.map(
      (link) => `${link.resource.resourceType.name} — ${link.resource.label}`,
    ),
  }))

  let memberContext: {
    name: string
    email: string
    phone: string
    isActiveMember: boolean
    creditBalanceCentavos: number
  } | null = null

  if (session?.user?.id && session.user.role === 'member') {
    const customer = await prisma.customer.findUnique({
      where: { id: session.user.id },
    })

    if (customer) {
      const membership = await getActiveMembership(customer.id)
      memberContext = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isActiveMember: !!membership,
        creditBalanceCentavos: membership?.creditBalanceCentavos ?? 0,
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
