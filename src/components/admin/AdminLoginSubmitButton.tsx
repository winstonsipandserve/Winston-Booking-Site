'use client'

import { useFormStatus } from 'react-dom'

export default function AdminLoginSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80 disabled:active:scale-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
    >
      <svg
        className={`h-4 w-4 shrink-0 animate-spin transition-all duration-200 ${pending ? 'w-4 opacity-100' : 'w-0 opacity-0'}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{pending ? 'Signing In…' : 'Sign In'}</span>
    </button>
  )
}
