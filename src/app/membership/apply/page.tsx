import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MembershipApplicationForm from '@/components/membership/MembershipApplicationForm'

export default function MembershipApplyPage() {
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center">
          <div className="flex w-full max-w-md flex-col items-start text-left">
            <Link
              href="/membership"
              className="text-sm font-medium text-accent-light transition-colors hover:text-brand-light"
            >
              &larr; Back to Membership Info
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-serif text-3xl text-brand-light md:text-4xl">Become a Member</h1>
            <p className="max-w-md text-brand-light/80">
              Apply for membership below. We&apos;ll review your application and email you once a
              decision is made.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-1 flex-col items-center gap-8 bg-background px-6 pt-16 pb-16 md:pt-20">
        <MembershipApplicationForm />
      </div>
      <Footer />
    </>
  )
}
