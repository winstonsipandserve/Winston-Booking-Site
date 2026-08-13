import Image from 'next/image'
import Link from 'next/link'
import SocialIcons from '@/components/ui/SocialIcons'

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-28 pt-20 sm:pb-36 sm:pt-28">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/placeholder.jpg"
          alt="Winston Sip & Serve facility"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/70 to-brand-dark/40" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-light">
            Winston Sip &amp; Serve
          </span>

          <h1 className="mt-6 text-4xl italic leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Sip. Serve. Play.
            <br />
            Repeat.
          </h1>

          <p className="mt-6 max-w-md text-lg text-white/80">
            Tennis, pickleball, and golf simulation — paired with craft coffee and a
            members-only speakeasy bar.
          </p>

          <div className="mt-8">
            <Link
              href="/book"
              className="inline-block rounded-full bg-accent-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-mid"
            >
              Book Now
            </Link>
          </div>

          <div className="mt-20 sm:mt-28">
            <SocialIcons variant="light" />
          </div>
        </div>
      </div>
    </section>
  )
}
