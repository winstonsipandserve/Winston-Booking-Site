import Reveal from '@/components/ui/Reveal'

const STEPS = [
  {
    title: 'Submit Your Application',
    description:
      'Fill in your name, address, contact number, email, and a government ID (front, back, and a selfie with the ID).',
  },
  {
    title: 'Pending Review',
    description:
      'Your application sits with our team for manual review — there’s no account or dashboard to check status in the meantime.',
  },
  {
    title: 'Admin Decision by Email',
    description:
      'We’ll email you once a decision is made, whether approved or not.',
  },
]

export default function ApplicationProcess() {
  return (
    <section className="bg-brand-light py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">How It Works</p>
            <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">
              Application Process
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delayMs={index * 100}>
              <div className="flex flex-col items-start">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary font-serif text-lg text-brand-light">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-serif text-xl text-brand-dark">{step.title}</h3>
                <p className="mt-2 text-sm text-neutral-700">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
