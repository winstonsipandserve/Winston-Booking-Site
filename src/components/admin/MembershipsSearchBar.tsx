'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MembershipsSearchBar() {
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
    router.push(`/admin/memberships${query ? `?${query}` : ''}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search memberships…"
        className="rounded-lg border border-gray-300 px-3 py-1.5 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
      />
      <button
        type="submit"
        className="rounded-lg px-3 py-1.5 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        Search
      </button>
    </form>
  )
}
