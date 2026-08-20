const CONTACT_ITEMS = [
  {
    label: 'East Fairview Park Subdivision',
    icon: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z',
  },
  {
    label: '(02) 8123-4567',
    icon: 'M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.5c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z',
  },
  {
    label: 'hello@winstonsipandserve.com',
    icon: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1.4 2 6.6 5.5L18.6 6H5.4Zm-.4 1.4V19h16V7.4l-7.4 6.2a1 1 0 0 1-1.2 0L5 7.4Z',
  },
]

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
          <ul className="mt-4 flex flex-col gap-3">
            {CONTACT_ITEMS.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm text-neutral-700">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 fill-brand-mid">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
