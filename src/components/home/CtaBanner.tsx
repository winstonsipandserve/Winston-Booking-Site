import Link from 'next/link'

export default function CtaBanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4B2E2B 0%, #8C5A3C 100%)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='18' fill='none' stroke='%23ffffff' stroke-opacity='0.08' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: '48px 48px',
          backgroundRepeat: 'repeat',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent-primary opacity-20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-mid opacity-20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 text-center">
        <h2 className="text-4xl font-semibold text-white">Ready to Play?</h2>
        <p className="mx-auto mt-3 max-w-xl text-xl text-white/80">
          Reserve your court or simulator right now — it only takes a minute.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/book"
            className="rounded-xl bg-accent-primary px-6 py-3 text-base font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-mid"
          >
            Book Now
          </Link>
          <Link
            href="/membership"
            className="rounded-xl border border-white/60 px-6 py-3 text-base font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            Explore Membership
          </Link>
        </div>
      </div>
    </section>
  )
}
