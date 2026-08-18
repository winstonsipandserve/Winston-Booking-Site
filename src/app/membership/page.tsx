import MembershipApplicationForm from '@/components/membership/MembershipApplicationForm'

export default function MembershipPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-brand-dark">Become a Member</h1>
        <p className="max-w-md text-neutral-700">
          Apply for membership below. We&apos;ll review your application and email you once a
          decision is made.
        </p>
      </div>
      <MembershipApplicationForm />
    </div>
  )
}
