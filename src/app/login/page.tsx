import Navbar from '@/components/layout/Navbar'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm">
          <p className="text-sm text-gray-500">Member Access</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Sign In</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back. Enter your details to continue.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </main>
    </>
  )
}
