import BookingPageClient from '@/components/booking/BookingPageClient'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getActiveMembership } from '@/lib/customer-resolution'
import { prisma } from '@/lib/prisma'
import { auth } from '../../../auth'

export default async function BookPage() {
  const session = await auth()

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

      <BookingPageClient memberContext={memberContext} />
      <Footer />
    </>
  )
}
