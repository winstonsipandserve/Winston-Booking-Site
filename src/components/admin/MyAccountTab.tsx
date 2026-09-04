import ProfileCard from '@/components/admin/ProfileCard'
import ThemeToggle from '@/components/admin/ThemeToggle'
import ChangePasswordForm from '@/components/admin/ChangePasswordForm'

interface MyAccountTabProps {
  name: string
  email: string
}

export default function MyAccountTab({ name, email }: MyAccountTabProps) {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <ProfileCard name={name} email={email} />
      <ThemeToggle />
      <ChangePasswordForm />
    </div>
  )
}
