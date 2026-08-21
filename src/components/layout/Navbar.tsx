'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Book Now', href: '/book' },
  { label: 'News', href: '/news' },
  { label: 'Cafe & Bar', href: '/cafe-bar' },
  { label: 'Membership', href: '/membership' },
  { label: 'About', href: '/about' },
]

const SCROLL_THRESHOLD = 50

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setSignedIn(sessionStorage.getItem('winston_member_session') === 'true')
  }, [])

  function handleSignOut() {
    sessionStorage.removeItem('winston_member_session')
    setSignedIn(false)
    router.push('/')
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled ? 'bg-brand-light' : 'bg-brand-light/[0.01]'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105"
        >
          <Image
            src="/images/brand/winston-logo-emblem-transparent.png"
            alt="Winston Sip & Serve"
            width={500}
            height={500}
            className={`h-11 w-auto transition-all duration-200 md:h-14 ${
              scrolled ? 'brightness-100 invert-0' : 'brightness-0 invert'
            }`}
            priority
          />
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/membership'
                ? pathname === link.href || pathname.startsWith(link.href + '/')
                : pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`group relative pb-1 text-sm font-normal uppercase tracking-[0.35px] transition-colors duration-200 ${
                    isActive
                      ? `${scrolled ? 'text-brand-dark' : 'text-accent-light'} after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent-primary`
                      : scrolled
                        ? 'text-gray-700 hover:text-brand-dark'
                        : 'text-accent-light/90 hover:text-accent-light'
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

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Book a Court
            <span aria-hidden="true">→</span>
          </Link>
          {signedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
                scrolled ? 'border-brand-mid text-brand-dark' : 'border-accent-light/60 text-accent-light'
              }`}
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
                scrolled ? 'border-brand-mid text-brand-dark' : 'border-accent-light/60 text-accent-light'
              }`}
            >
              Sign In
            </Link>
          )}
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
        <div className="border-t border-accent-light bg-brand-light px-6 pb-6 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === '/membership'
                  ? pathname === link.href || pathname.startsWith(link.href + '/')
                  : pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-base font-normal uppercase tracking-[0.35px] ${
                      isActive ? 'text-brand-dark' : 'text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/book"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Book a Court
              <span aria-hidden="true">→</span>
            </Link>
            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  handleSignOut()
                }}
                className="block w-full rounded-lg border border-brand-mid px-5 py-2.5 text-center text-sm font-semibold text-brand-dark transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-lg border border-brand-mid px-5 py-2.5 text-center text-sm font-semibold text-brand-dark transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
