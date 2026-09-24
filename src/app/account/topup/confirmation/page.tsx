import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ConfirmationContent from './ConfirmationContent'

export default function MembershipTopUpConfirmationPage() {
  return (
    <>
      <Navbar />

      <section className="border-b border-gray-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-gray-500">Membership</p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">Credit Top-Up</h1>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-gray-50 px-6 py-10">
        <Suspense fallback={<p className="text-gray-500">Loading your top-up…</p>}>
          <ConfirmationContent />
        </Suspense>
      </div>
      <Footer />
    </>
  )
}
