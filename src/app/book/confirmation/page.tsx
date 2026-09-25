import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import ConfirmationContent from './ConfirmationContent'

export default function BookingConfirmationPage() {
  return (
    <>
      <Navbar />

      <section className="border-b border-gray-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Your Booking</h1>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-gray-50 px-6 py-10">
        <Suspense fallback={<p className="text-gray-500">Loading your booking…</p>}>
          <ConfirmationContent />
        </Suspense>
      </div>
    </>
  )
}
