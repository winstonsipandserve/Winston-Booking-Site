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
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-mid">
            SIMPLE & FAST
          </span>
          <h2 className="mt-3 text-4xl font-semibold text-brand-dark">How It Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-xl text-gray-600">
            Reserve your court in under two minutes — no account required for this demo.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div
            className="absolute top-8 left-0 right-0 hidden h-0.5 bg-accent-light sm:block"
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-white shadow-card">
                {step.number}
              </div>
              <p className="mt-5 font-medium text-brand-dark">{step.title}</p>
              <p className="mt-2 max-w-xs text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
