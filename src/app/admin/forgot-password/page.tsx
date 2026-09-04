import AdminForgotPasswordForm from '@/components/admin/AdminForgotPasswordForm'

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Winston Sip &amp; Serve</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter your admin email and we&apos;ll send you a link to reset your password.
        </p>
        <AdminForgotPasswordForm />
      </div>
    </div>
  )
}
