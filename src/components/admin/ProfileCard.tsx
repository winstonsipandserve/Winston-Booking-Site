interface ProfileCardProps {
  name: string
  email: string
}

export default function ProfileCard({ name, email }: ProfileCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Name</span>
        <span className="text-gray-900 dark:text-gray-100">{name}</span>
      </div>
      <div className="mt-3 flex flex-col gap-1 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Email</span>
        <span className="text-gray-900 dark:text-gray-100">{email}</span>
      </div>
    </div>
  )
}
