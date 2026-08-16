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
    <section className="bg-brand-dark py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="text-center">
            <span className="text-sm uppercase tracking-[0.3em] text-accent-primary">
              Simple & Fast
            </span>
            <h2 className="mt-4 font-serif text-5xl text-neutral-100 md:text-6xl">How It Works</h2>
            <p className="mt-4 text-lg text-neutral-100/70">
              Reserve your court in under two minutes
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delayMs={index * 100} className="h-full">
              <div className="relative flex h-full flex-col rounded-2xl border border-neutral-100/10 bg-brand-mid/10 p-8">
                <span className="font-serif text-6xl text-accent-primary/25 md:text-7xl">
                  {String(step.number).padStart(2, '0')}
                </span>
                <h3 className="mt-2 font-serif text-2xl text-neutral-100">{step.title}</h3>
                <p className="mt-3 text-neutral-100/70">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
