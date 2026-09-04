import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '../../../../auth'
import PasswordInput from '@/components/ui/PasswordInput'
import AdminLoginErrorModal from '@/components/admin/AdminLoginErrorModal'

async function authenticate(formData: FormData) {
  'use server'
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/admin/login?error=1')
    }
    throw error
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Winston Sip &amp; Serve</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">Admin Login</h1>
        <AdminLoginErrorModal hasError={!!error} />
        <form action={authenticate} className="mt-6 flex flex-col gap-4">
          <label htmlFor="email" className="flex flex-col gap-1 text-sm text-gray-900">
            Email
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <PasswordInput id="password" name="password" label="Password" required autoComplete="current-password" />
          <button
            type="submit"
            className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Sign In
          </button>
        </form>
        <Link
          href="/admin/forgot-password"
          className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
