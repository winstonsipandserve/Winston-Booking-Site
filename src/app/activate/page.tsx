import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ActivateForm from './ActivateForm'

export default function ActivatePage() {
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
            Account Activation
          </span>

          <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">
            Activate Your Account
          </h1>

          <p className="mt-6 max-w-xl text-brand-light/80">
            Set a password to finish activating your Winston Sip and Serve membership account.
          </p>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-brand-light px-6 pt-16 pb-16 md:pt-20">
        <Suspense
          fallback={<p className="text-brand-dark/70">Loading…</p>}
        >
          <ActivateForm />
        </Suspense>
      </div>
      <Footer />
    </>
  )
}
