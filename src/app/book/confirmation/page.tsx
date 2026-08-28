import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ConfirmationContent from './ConfirmationContent'

export default function BookingConfirmationPage() {
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
            Booking Confirmation
          </span>

          <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">Your Booking</h1>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-brand-light px-6 py-16">
        <Suspense fallback={<p className="text-brand-dark/60">Loading your booking…</p>}>
          <ConfirmationContent />
        </Suspense>
      </div>
      <Footer />
    </>
  )
}
