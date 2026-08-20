import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MembershipApplicationForm from '@/components/membership/MembershipApplicationForm'

export default function MembershipApplyPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 pt-32 pb-16 md:pt-40">
        <div className="flex w-full max-w-md flex-col items-start">
          <Link
            href="/membership"
            className="text-sm font-medium text-accent-primary transition-colors hover:text-brand-dark"
          >
            &larr; Back to Membership Info
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-dark">Become a Member</h1>
          <p className="max-w-md text-neutral-700">
            Apply for membership below. We&apos;ll review your application and email you once a
            decision is made.
          </p>
        </div>
        <MembershipApplicationForm />
      </div>
      <Footer />
    </>
  )
}
