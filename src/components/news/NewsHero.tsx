export default function NewsHero() {
  return (
    <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
          What&apos;s Happening
        </span>

        <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">
          News &amp; Announcements
        </h1>

        <p className="mt-6 max-w-xl text-brand-light/80">
          Renovations, closures, tournaments, and everything else happening at Winston.
        </p>
      </div>
    </section>
  )
}
