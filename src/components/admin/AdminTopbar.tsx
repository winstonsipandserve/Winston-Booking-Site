import Image from 'next/image'
import SignOutButton from '@/components/admin/SignOutButton'

export default function AdminTopbar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase() || '?'

  return (
    <header className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Image
          src="/images/brand/winston-logo-emblem-transparent.png"
          alt="Winston Sip & Serve"
          width={500}
          height={500}
          className="h-8 w-auto"
        />
        <span className="text-sm font-semibold text-gray-900">Winston Admin</span>
      </div>
      <div className="flex items-center gap-3">
        <div
          title={email}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700"
        >
          {initials}
        </div>
        <SignOutButton />
      </div>
    </header>
  )
}
