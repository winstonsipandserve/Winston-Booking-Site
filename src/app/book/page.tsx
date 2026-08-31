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

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
            Book Now
          </span>

          <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">
            Book a Court or Simulator
          </h1>
        </div>
      </section>

      <BookingPageClient memberContext={memberContext} />
      <Footer />
    </>
  )
}
