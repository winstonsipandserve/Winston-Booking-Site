import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from '../../../../auth'
import PasswordInput from '@/components/ui/PasswordInput'
import AdminLoginErrorModal from '@/components/admin/AdminLoginErrorModal'
import AdminLoginSubmitButton from '@/components/admin/AdminLoginSubmitButton'
import AdminThemeInit from '@/components/admin/AdminThemeInit'

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
    <div className="flex h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 font-sans dark:bg-gray-950">
      <AdminThemeInit />
      <div className="grid w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gray-900 md:block">
          <Image
            src="/images/placeholder.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-40 grayscale"
          />
          <div className="absolute inset-0 bg-gray-950/70" />
          <div className="relative z-10 flex h-full flex-col justify-end p-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Winston Sip &amp; Serve</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Admin Console</h2>
            <p className="mt-2 text-sm text-gray-300">
              Manage bookings, memberships, and club operations.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-gray-200 px-6 py-10 dark:border-gray-800 md:border-t-0 md:border-l md:px-10">
          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Winston Sip &amp; Serve</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Login</h1>
            <AdminLoginErrorModal hasError={!!error} />
            <form action={authenticate} className="mt-6 flex flex-col gap-4">
              <label htmlFor="email" className="flex flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
                Email
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </label>
              <PasswordInput id="password" name="password" label="Password" required autoComplete="current-password" />
              <AdminLoginSubmitButton />
            </form>
            <Link
              href="/admin/forgot-password"
              className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
