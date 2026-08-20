import Reveal from '@/components/ui/Reveal'

export default function OurStory() {
  return (
    <section className="bg-brand-light py-24 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <Reveal>
          <h2 className="font-serif text-4xl text-brand-dark md:text-5xl">Our Story</h2>
          {/* PLACEHOLDER COPY — replace with the real founding story once Arjay/client provides it. No real names, dates, or history should be inferred from this text. */}
          <p className="mt-6 text-neutral-700">
            Winston Sip &amp; Serve started with a simple idea: a place where the game
            doesn&rsquo;t have to end when you leave the court. What began as a shared love of
            sport and good company has grown into a home for players and neighbors alike — a
            space to train, compete, unwind, and connect, all under one roof in East Fairview.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
