import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm">
          <p className="text-sm text-gray-500">Password Reset</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Reset Your Password</h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose a new password for your Winston Sip and Serve account.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  )
}
