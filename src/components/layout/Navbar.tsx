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

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-brand-light">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105"
        >
          <Image
            src="/images/brand/winston-logo-emblem-transparent.png"
            alt="Winston Sip & Serve"
            width={500}
            height={500}
            className="h-11 w-auto md:h-14"
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
                      ? 'text-brand-dark after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent-primary'
                      : 'text-gray-700 hover:text-brand-dark'
                  }`}
                >
                  {link.label}
                  {!isActive && (
                    <span
                      className="absolute left-0 right-0 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-accent-primary transition-transform duration-200 group-hover:scale-x-100"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

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
        <div className="border-t border-accent-light bg-brand-light px-6 pb-6 md:hidden">
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
        </div>
      )}
    </header>
  )
}
