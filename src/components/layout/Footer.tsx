import Link from 'next/link'
import SocialIcons from '@/components/ui/SocialIcons'

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Book Now', href: '/book' },
  { label: 'News', href: '/news' },
  { label: 'Cafe & Bar', href: '/cafe-bar' },
  { label: 'Membership', href: '/membership' },
  { label: 'About', href: '/about' },
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
              Winston <span className="text-accent-primary">Sip & Serve</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Tennis, pickleball, and golf simulation — paired with craft coffee and a
              members-only bar. Open daily 6AM – 10PM.
            </p>
            <div className="mt-6">
              <SocialIcons variant="light" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-accent-light">
              Contact
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
