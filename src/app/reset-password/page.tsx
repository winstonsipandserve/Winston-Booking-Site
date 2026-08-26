import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 pt-32 pb-16 md:pt-40">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-dark">
            Reset Your Password
          </h1>
          <p className="max-w-md text-neutral-700">
            Choose a new password for your Winston Sip and Serve account.
          </p>
        </div>
        <Suspense
          fallback={<p className="text-neutral-700">Loading…</p>}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
      <Footer />
    </>
  )
}
