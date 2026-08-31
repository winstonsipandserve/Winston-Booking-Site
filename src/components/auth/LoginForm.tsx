'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import PasswordInput from '@/components/ui/PasswordInput'

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
    <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-brand-dark">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-lg border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none"
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          required
          labelClassName="flex flex-col gap-1 text-sm font-medium text-brand-dark"
          inputClassName="w-full rounded-lg border border-brand-dark/20 bg-brand-light px-3 py-2 pr-10 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none"
          toggleClassName="absolute right-2 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark"
        />

        {error && <p className="text-sm text-red-600">Invalid email or password.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-none bg-accent-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Signing In…' : 'Sign In'}
        </button>

        <Link
          href="/forgot-password"
          className="text-center text-sm text-brand-dark/50"
        >
          Forgot password?
        </Link>
      </form>
    </div>
  )
}
