import Image from 'next/image'

export default function HoursLocation() {
  return (
    <section className="bg-brand-light py-24 md:py-28">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 md:grid-cols-2 md:px-10">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Hours</p>
          <h2 className="mt-4 font-serif text-3xl text-brand-dark md:text-4xl">Café Hours</h2>
          <p className="mt-4 text-neutral-700">Hours: To be announced.</p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Location</p>
          <h2 className="mt-4 font-serif text-3xl text-brand-dark md:text-4xl">Find Us</h2>
          <p className="mt-4 text-sm font-medium text-neutral-700">East Fairview Park Subdivision</p>
          <div className="mt-4 overflow-hidden rounded-2xl shadow-card">
            <div className="relative aspect-[16/9] w-full">
              <Image src="/images/placeholder.jpg" alt="Map to Winston Sip and Serve" fill className="object-cover" />
            </div>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
            Map — embed coming soon.
          </p>
        </div>
      </div>
    </section>
  )
}
