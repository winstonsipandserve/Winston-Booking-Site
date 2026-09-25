import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TierCards from '@/components/membership/TierCards'
import { foundingSeatsRemaining } from '@/lib/membership-founding'

// Reads the live Founding seat count, so never prerender.
export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const seatsRemaining = await foundingSeatsRemaining()
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-gray-900">Membership</h1>
        <div className="mt-10">
          <TierCards foundingSeatsRemaining={seatsRemaining} />
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/membership/apply"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
          >
            Apply for Membership
          </Link>
        </div>
      </section>
      <Footer />
    </>
  )
}
