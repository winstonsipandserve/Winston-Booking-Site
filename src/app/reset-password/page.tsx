import { Suspense } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-background px-6 pt-28 pb-12 md:pt-32">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-card border border-brand-dark/10 bg-brand-light shadow-card md:grid-cols-2">
          <div className="relative min-h-[220px] overflow-hidden bg-brand-dark md:min-h-[600px]">
            <Image
              src="/images/placeholder.jpg"
              alt=""
              fill
              priority
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-brand-dark/70" />
            <div className="hero-text-shadow relative z-10 flex h-full flex-col justify-end p-8 sm:p-10 lg:p-12">
              <span className="text-xs uppercase tracking-[0.35em] text-accent-light/80">
                Winston Sip &amp; Serve
              </span>
              <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-brand-light lg:text-4xl">
                Back In, Better Secured.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-on-dark-muted">
                Choose a new password to get back to reserving courts, tracking credits, and more.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-brand-dark/10 px-6 py-12 md:border-t-0 md:border-l md:px-12 md:py-14 lg:px-16">
            <div className="w-full max-w-sm">
              <span className="text-xs uppercase tracking-[0.35em] text-accent-primary">
                Password Reset
              </span>
              <h1 className="mt-3 font-serif text-3xl text-on-light md:text-4xl">
                Reset Your Password
              </h1>
              <p className="mt-2 text-sm text-on-light-muted">
                Choose a new password for your Winston Sip and Serve account.
              </p>

              <div className="mt-8">
                <Suspense fallback={<p className="text-brand-dark/70">Loading…</p>}>
                  <ResetPasswordForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
