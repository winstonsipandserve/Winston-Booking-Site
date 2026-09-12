export default function NewsHeader() {
  return (
    <section className="bg-brand-dark pt-36 pb-16 md:pt-44 md:pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent-light/80">
            Winston Journal
          </span>
          <h1 className="mt-5 max-w-md font-serif text-5xl leading-[1.05] text-accent-light md:text-6xl">
            News &amp; Stories
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-brand-light/75 md:text-right">
          Tournaments, promotions, community stories, and club updates from the Winston team.
          Booking-specific notices now appear before you choose a court or bay.
        </p>
      </div>
    </section>
  )
}
