import Image from 'next/image'
import Link from 'next/link'

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-brand-dark py-24 md:py-28">
      <Image
        src="/images/cta-background.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-brand-dark/70" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
        <div className="max-w-xl">
          <h2 className="font-serif text-4xl text-brand-light md:text-5xl">Ready to Play?</h2>
          <p className="mt-4 max-w-md text-brand-light/85">
            Reserve a court, grab a seat at the bar, or see what membership unlocks — your next
            game is a couple of taps away.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Book Now
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-none border border-brand-light px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Explore Membership
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
