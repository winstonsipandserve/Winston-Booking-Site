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
  'East Fairview Park Subdivision',
  '(02) 8123-4567',
  'winstonsipandserve@gmail.com',
  'Open Daily: 6:00 AM – 10:00 PM',
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-600">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold text-gray-900">Winston Sip & Serve</p>
            <p className="mt-3 max-w-xs text-sm text-gray-500">
              Tennis, pickleball, and golf simulation, plus a bookable lounge and conference
              room — paired with craft coffee and a members-only bar.
            </p>
            <div className="mt-4">
              <SocialIcons />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Contact</p>
            <ul className="mt-3 flex flex-col gap-2">
              {CONTACT_ITEMS.map((item) => (
                <li key={item} className="text-sm text-gray-500">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Quick Links</p>
            <ul className="mt-3 flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Winston Sip & Serve. All rights reserved.</p>
          <p>Tennis & Pickleball Recreation Center</p>
        </div>
      </div>
    </footer>
  )
}
