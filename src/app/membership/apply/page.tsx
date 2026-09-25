import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MembershipApplicationForm from '@/components/membership/MembershipApplicationForm'
import { foundingSeatsRemaining } from '@/lib/membership-founding'

// Reads the live Founding seat count, so never prerender.
export const dynamic = 'force-dynamic'

export default async function MembershipApplyPage() {
  const seatsRemaining = await foundingSeatsRemaining()
  return (
    <>
      <Navbar />

      <section className="border-b border-gray-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/membership" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            &larr; Back to Membership Info
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900">Become a Member</h1>
          <p className="mt-2 max-w-md text-gray-500">
            Apply for membership below. We&apos;ll review your application and email you once a
            decision is made.
          </p>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-gray-50 px-6 py-10">
        <MembershipApplicationForm foundingSeatsRemaining={seatsRemaining} />
      </div>
      <Footer />
    </>
  )
}
