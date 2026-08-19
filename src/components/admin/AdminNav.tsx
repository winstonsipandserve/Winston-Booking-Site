'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/resources', label: 'Resources & Pricing' },
  { href: '/admin/memberships', label: 'Memberships' },
  { href: '/admin/bulletin', label: 'Bulletin' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontWeight: isActive ? 'bold' : 'normal',
              textDecoration: isActive ? 'underline' : 'none',
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
