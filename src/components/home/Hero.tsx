'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-background.jpg"
        alt="Tennis court with diagonal white lines, blue court and green surround"
        fill
        className="object-cover object-[center_65%]"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-brand-dark/20 to-brand-dark/50" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <h1 className="font-script text-6xl leading-none text-neutral-100 md:text-8xl">Winston</h1>

        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-neutral-100 md:mt-4 md:text-base">
          Sip & Serve
        </p>

        <p className="mt-6 max-w-md text-xs uppercase tracking-[0.2em] text-neutral-100/80 md:max-w-xl md:text-sm">
          Tennis · Pickleball · Golf Simulator · Café & Bar
        </p>

        <Link
          href="/book"
          className="mt-10 inline-block rounded-full bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Book Now
        </Link>
      </div>

      <button
        type="button"
        aria-label="Scroll to stats"
        onClick={() => document.getElementById('stats-bar')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-28 left-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-100/50 text-neutral-100 transition-colors duration-300 hover:border-neutral-100 hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light motion-reduce:transition-none md:bottom-32 md:left-10 md:h-14 md:w-14"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 md:h-6 md:w-6"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </section>
  )
}
