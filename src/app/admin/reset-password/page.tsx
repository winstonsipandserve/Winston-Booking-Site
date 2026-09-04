import { Suspense } from 'react'
import AdminResetPasswordForm from '@/components/admin/AdminResetPasswordForm'

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Winston Sip &amp; Serve</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">Reset Password</h1>
        <p className="mt-2 text-sm text-gray-500">Choose a new password for your admin account.</p>
        <Suspense fallback={<p className="mt-6 text-sm text-gray-500">Loading…</p>}>
          <AdminResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
