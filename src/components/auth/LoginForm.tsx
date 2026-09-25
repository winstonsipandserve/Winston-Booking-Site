'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import PasswordInput from '@/components/ui/PasswordInput'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

export default function LoginForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(false)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await signIn('member-credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirect: false,
      })
      if (result?.error) {
        setError(true)
        return
      }
      router.push('/account')
    } catch {
      setError(true)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full">
      <LoadingOverlay isOpen={isPending} label="Signing In…" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          required
          labelClassName="flex flex-col gap-1 text-sm font-medium text-gray-900"
          inputClassName="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
          toggleClassName="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        />

        {error && <p className="text-sm text-red-600">Invalid email or password.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sign In
        </button>

        <Link href="/forgot-password" className="text-center text-sm text-gray-500">
          Forgot password?
        </Link>
      </form>
    </div>
  )
}
