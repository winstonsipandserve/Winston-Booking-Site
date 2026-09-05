'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function BookingsSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const params = new URLSearchParams(searchParams)
    const trimmed = value.trim()
    if (trimmed) {
      params.set('search', trimmed)
    } else {
      params.delete('search')
    }
    params.delete('page')

    const query = params.toString()
    router.push(`/admin/bookings${query ? `?${query}` : ''}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search bookings…"
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
      />
      <button
        type="submit"
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Search
      </button>
    </form>
  )
}
