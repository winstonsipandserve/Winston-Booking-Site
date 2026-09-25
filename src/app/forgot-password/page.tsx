import Navbar from '@/components/layout/Navbar'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm">
          <p className="text-sm text-gray-500">Password Reset</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the email associated with your account and we&apos;ll send you a reset link.
          </p>

          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </>
  )
}
