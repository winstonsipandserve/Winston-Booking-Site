import Link from 'next/link'

export default function CtaBanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4B2E2B 0%, #8C5A3C 100%)' }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-brand-light/10"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="cta-dot-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="34" cy="42" r="12" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="150" cy="28" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="170" cy="150" r="16" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="55" cy="160" r="42" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-dot-pattern)" />
      </svg>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 text-center">
        <h2 className="text-4xl font-semibold text-white">Ready to Play?</h2>
        <p className="mx-auto mt-3 max-w-xl text-xl text-white/80">
          Reserve a court, grab a seat at the bar, or see what membership unlocks — your next
          game is a couple of taps away.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/book"
            className="rounded-xl bg-accent-primary px-6 py-3 text-base font-medium uppercase text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-mid"
          >
            Book Now
          </Link>
          <Link
            href="/membership"
            className="rounded-xl border border-white/60 px-6 py-3 text-base font-medium uppercase text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            Explore Membership
          </Link>
        </div>
      </div>
    </section>
  )
}
