import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-background.jpg"
        alt="Tennis court with diagonal white lines, blue court and green surround"
        fill
        className="object-cover object-[center_65%]"
        priority
      />
      <div className="absolute inset-0 bg-brand-dark/55" />

      <div className="relative z-10 flex flex-col items-center px-6 pb-16 text-center">
        <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
          East Fairview&rsquo;s Private Sports Club
        </span>

        <h1 className="mt-4 font-script text-7xl leading-none text-neutral-100 md:text-9xl">Winston</h1>

        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-neutral-100 md:mt-4 md:text-base">
          Sip & Serve
        </p>

        <p className="mt-6 max-w-md text-xs uppercase tracking-[0.2em] text-neutral-100/80 md:max-w-xl md:text-sm">
          Tennis · Pickleball · Golf Simulator · Café & Bar
        </p>

        <Link
          href="/book"
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Book Now
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
