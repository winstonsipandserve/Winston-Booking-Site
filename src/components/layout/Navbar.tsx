'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
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

function SocialIcons() {
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_ICONS.map((icon) => (
        <a
          key={icon.label}
          href="#"
          aria-label={icon.label}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-mid text-brand-dark transition-colors hover:bg-accent-light"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d={icon.path} />
          </svg>
        </a>
      ))}
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-cream">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="shrink-0 transition-transform hover:scale-105">
          <Image
            src="/images/brand/logo.png"
            alt="Winston Sip & Serve"
            width={80}
            height={80}
            priority
          />
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`group relative pb-1 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-brand-dark after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent'
                      : 'text-gray-700 hover:text-brand-dark'
                  }`}
                >
                  {link.label}
                  {!isActive && (
                    <span
                      className="absolute left-0 right-0 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-accent transition-transform duration-200 group-hover:scale-x-100"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <SocialIcons />
          <button
            type="button"
            className="rounded-full border border-brand-mid px-5 py-2 text-sm font-medium text-brand-dark transition-all duration-200 hover:bg-accent-light"
          >
            My Account
          </button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-brand-dark md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-accent-light bg-cream px-6 pb-6 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-base font-medium ${
                      isActive ? 'text-brand-dark' : 'text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <SocialIcons />
            <button
              type="button"
              className="rounded-full border border-brand-mid px-5 py-2 text-sm font-medium text-brand-dark transition-all duration-200 hover:bg-accent-light"
            >
              My Account
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
