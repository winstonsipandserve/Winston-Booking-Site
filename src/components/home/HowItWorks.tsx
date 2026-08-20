import Reveal from '@/components/ui/Reveal'

const STEPS = [
  {
    number: 1,
    title: 'Choose Your Sport',
    description:
      'Pick from Tennis, Pickleball, Golf Simulator, or Pickleball Simulator — then select your court or simulator slot.',
  },
  {
    number: 2,
    title: 'Pick a Schedule',
    description: 'Select your date and time range. All hours in between are reserved automatically.',
  },
  {
    number: 3,
    title: 'Play!',
    description: 'Confirm your booking and get your reference number. Show up, play, then grab a coffee.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-brand-dark py-28 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-light">Simple & Fast</p>
            <h2 className="mt-4 font-serif text-5xl text-neutral-100 md:text-6xl">How It Works</h2>
            <p className="mt-4 text-lg text-neutral-100/70">
              Reserve your court in under two minutes
            </p>
          </div>
        </Reveal>

        <div className="relative mt-20 md:mt-24">
          <div
            aria-hidden="true"
            className="absolute left-7 top-0 h-full w-px bg-accent-light/35 md:left-0 md:top-7 md:h-px md:w-full"
          />

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delayMs={index * 100} className="relative flex gap-5 md:flex-col md:gap-0">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent-light/40 bg-brand-dark font-serif text-lg text-accent-light">
                  {String(step.number).padStart(2, '0')}
                </span>
                <div className="md:mt-6">
                  <h3 className="font-serif text-2xl text-neutral-100">{step.title}</h3>
                  <p className="mt-3 text-neutral-100/70">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
