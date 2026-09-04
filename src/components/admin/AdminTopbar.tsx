import Image from 'next/image'
import SignOutButton from '@/components/admin/SignOutButton'

export default function AdminTopbar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase() || '?'

  return (
    <header className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Image
          src="/images/brand/winston-logo-emblem-transparent.png"
          alt="Winston Sip & Serve"
          width={500}
          height={500}
          className="h-8 w-auto dark:brightness-125 dark:saturate-75"
        />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Winston Admin</span>
      </div>
      <div className="flex items-center gap-3">
        <div
          title={email}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
        >
          {initials}
        </div>
        <SignOutButton />
      </div>
    </header>
  )
}
