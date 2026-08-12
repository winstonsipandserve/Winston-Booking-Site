import Reveal from '@/components/ui/Reveal'

const TESTIMONIALS = [
  {
    name: 'Marco Villanueva',
    sport: 'Tennis',
    quote:
      "Booking a court used to be a hassle of phone calls and guesswork. Now I reserve my slot in under a minute and the court is always ready when I arrive.",
  },
  {
    name: 'Sofia Reyes',
    sport: 'Pickleball',
    quote:
      "The pickleball courts are immaculate and the booking system makes it so easy to lock in a weekly game with friends. The cafe afterward is the perfect bonus.",
  },
  {
    name: 'David Santos',
    sport: 'Golf Simulator',
    quote:
      "The golf simulators feel like the real thing. I come in after work a few times a week, and having craft coffee and a proper bar on-site makes it feel like a club, not just a facility.",
  },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

export default function Testimonials() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-semibold tracking-wide text-brand-mid">
              HAPPY MEMBERS
            </span>
            <h2 className="mt-3 text-4xl font-semibold text-brand-dark">
              What Our Members Say
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xl text-gray-600">
              Players and regulars who keep coming back to Winston.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.name} delayMs={index * 100}>
              <div className="flex flex-col rounded-2xl bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hero">
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg key={index} viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5Z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm text-gray-600">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-brand-dark">
                    {initials(testimonial.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-dark">{testimonial.name}</p>
                    <p className="text-xs text-gray-600">{testimonial.sport}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
