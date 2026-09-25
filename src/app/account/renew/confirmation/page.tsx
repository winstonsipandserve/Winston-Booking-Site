import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import ConfirmationContent from './ConfirmationContent'

export default function MembershipRenewalConfirmationPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-md">
          <p className="text-center text-sm text-gray-500">Membership</p>
          <h1 className="mt-1 text-center text-3xl font-semibold text-gray-900">
            Membership Renewal
          </h1>

          <div className="mt-6">
            <Suspense fallback={<p className="text-center text-gray-500">Loading your renewal…</p>}>
              <ConfirmationContent />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  )
}
