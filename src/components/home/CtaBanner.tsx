import Link from 'next/link'

export default function CtaBanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4B2E2B 0%, #8C5A3C 100%)' }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent opacity-20 blur-3xl"
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
            className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-mid"
          >
            Book a Court →
          </Link>
          <Link
            href="/cafe-bar"
            className="rounded-xl border border-white/60 px-6 py-3 text-base font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            Explore the Cafe
          </Link>
        </div>
      </div>
    </section>
  )
}
