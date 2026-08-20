import Link from 'next/link'

export default function ApplyCta() {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center md:px-10">
        <Link
          href="/membership/apply"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Apply for Membership
        </Link>
      </div>
    </section>
  )
}
