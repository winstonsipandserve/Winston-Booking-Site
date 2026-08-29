'use client'

import { useState } from 'react'

interface PasswordInputProps {
  id: string
  name: string
  label: string
  required?: boolean
  autoComplete?: string
  labelClassName?: string
  inputClassName?: string
  toggleClassName?: string
}

export default function PasswordInput({
  id,
  name,
  label,
  required,
  autoComplete,
  labelClassName = 'flex flex-col gap-1 text-sm text-gray-900',
  inputClassName = 'w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-900',
  toggleClassName = 'absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <label htmlFor={id} className={labelClassName}>
      {label}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className={toggleClassName}
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </label>
  )
}

function EyeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function EyeOffIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 12S5.8 5.5 12 5.5c1.5 0 2.8.3 3.9.8M21.5 12S19.8 15.6 16.6 17.4M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
