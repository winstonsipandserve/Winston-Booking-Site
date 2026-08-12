import Link from 'next/link'

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Book Now', href: '/book' },
  { label: 'News', href: '/news' },
  { label: 'Cafe & Bar', href: '/cafe-bar' },
  { label: 'Membership', href: '/membership' },
  { label: 'About', href: '/about' },
]

const SOCIAL_ICONS = [
  {
    label: 'Facebook',
    path: 'M13.5 9H15V6.5h-1.75C11.2 6.5 10 7.7 10 9.75V11H8.5v2.5H10V18h2.5v-4.5H14l.5-2.5h-2v-1c0-.6.2-1 1-1Z',
  },
  {
    label: 'Instagram',
    path: 'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.5-3.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z',
  },
  {
    label: 'X',
    path: 'M4 4l7.2 8.1L4.4 20H7l5.4-6.2L16.8 20H20l-7.6-8.6L19.4 4H16.8l-5 5.7L7.4 4H4Z',
  },
]

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
  {
    label: 'Open Daily: 6:00 AM – 10:00 PM',
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l5 3 .9-1.5-4.1-2.4V7H11Z',
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold">
              Winston <span className="text-accent">Sip & Serve</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Tennis, pickleball, and golf simulation — paired with craft coffee and a
              members-only bar. Open daily 6AM – 10PM.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_ICONS.map((icon) => (
                <a
                  key={icon.label}
                  href="#"
                  aria-label={icon.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d={icon.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-accent-light">
              Quick Links
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-accent-light">
              Contact Us
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {CONTACT_ITEMS.map((item) => (
                <li key={item.label} className="flex items-start gap-2 text-sm text-white/70">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 fill-current">
                    <path d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Winston Sip & Serve. All rights reserved.</p>
          <p>Tennis & Pickleball Recreation Center</p>
        </div>
      </div>
    </footer>
  )
}
