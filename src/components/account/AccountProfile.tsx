export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AccountProfile({
  name,
  email,
  phone,
  memberSince,
}: {
  name: string
  email: string
  phone: string
  memberSince: Date | null
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white px-6 py-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
          {getInitials(name)}
        </span>
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
      </div>
      <dl className="mt-4 flex flex-col">
        <div className="flex flex-col gap-1 py-3">
          <dt className="text-gray-500">Name</dt>
          <dd className="font-medium text-gray-900">{name}</dd>
        </div>
        <div className="flex flex-col gap-1 border-t border-gray-200 py-3">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium text-gray-900">{email}</dd>
        </div>
        <div className="flex flex-col gap-1 border-t border-gray-200 py-3">
          <dt className="text-gray-500">Phone</dt>
          <dd className="font-medium text-gray-900">{phone}</dd>
        </div>
        {memberSince && (
          <div className="flex flex-col gap-1 border-t border-gray-200 py-3">
            <dt className="text-gray-500">Member since</dt>
            <dd className="font-medium text-gray-900">
              {memberSince.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Asia/Manila',
              })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}
