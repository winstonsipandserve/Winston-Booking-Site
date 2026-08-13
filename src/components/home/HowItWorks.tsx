import Reveal from '@/components/ui/Reveal'

const STEPS = [
  {
    number: 1,
    title: 'Choose Your Sport',
    description:
      'Pick tennis, pickleball, or golf simulation — courts and bays for every skill level.',
  },
  {
    number: 2,
    title: 'Pick a Schedule',
    description:
      'Browse live availability and lock in a date and time that works for you.',
  },
  {
    number: 3,
    title: 'Play!',
    description:
      'Show up, grab a coffee, and enjoy your session — we handle the rest.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">
              SIMPLE & FAST
            </span>
            <h2 className="mt-3 text-4xl font-semibold text-brand-dark">How It Works</h2>
            <p className="mx-auto mt-3 max-w-xl text-xl text-gray-700">
              Reserve your court in under two minutes — no account required for this demo.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delayMs={index * 100}>
              <div>
                <p className="text-6xl font-semibold leading-none text-accent-light sm:text-7xl">
                  {String(step.number).padStart(2, '0')}
                </p>
                <p className="mt-4 text-lg font-medium text-brand-dark">{step.title}</p>
                <p className="mt-2 max-w-xs text-sm text-gray-700">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
