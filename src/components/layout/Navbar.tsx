'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getInitials } from '@/components/account/AccountProfile'
import Modal from '@/components/ui/Modal'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Book Now', href: '/book' },
  { label: 'News', href: '/news' },
  { label: 'Cafe & Bar', href: '/cafe-bar' },
  { label: 'Membership', href: '/membership' },
  { label: 'About', href: '/about' },
]

const SCROLL_THRESHOLD = 50

const FORCE_SOLID_PAGES = ['/book', '/news']

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [signOutModalOpen, setSignOutModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const signedIn = status === 'authenticated' && session?.user?.role === 'member'
  // Menu-open forces the same solid header treatment as scrolled — otherwise the header strip
  // stays near-transparent (showing whatever's behind it) while the dropdown panel below is opaque,
  // producing a visible seam. The logo's invert state has to follow the same flag: leaving it tied
  // to `scrolled` alone would put the light/inverted logo on a now-solid light header.
  const headerSolid = scrolled || menuOpen

  useEffect(() => {
    if (FORCE_SOLID_PAGES.includes(pathname)) {
      setScrolled(true)
      return
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  function handleSignOut() {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        headerSolid ? 'bg-brand-light' : 'bg-brand-light/0'
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
              headerSolid ? 'brightness-100 invert-0' : 'brightness-0 invert'
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
          {signedIn ? (
            <Link
              href="/account"
              aria-label="My Account"
              className="flex h-10 w-10 items-center justify-center rounded-none bg-accent-primary/10 text-sm font-bold text-accent-primary transition-colors duration-300 hover:bg-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              {getInitials(session?.user?.name ?? '')}
            </Link>
          ) : (
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-none bg-accent-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
            >
              Book a Court
              <span aria-hidden="true">→</span>
            </Link>
          )}
          {signedIn ? (
            <button
              type="button"
              onClick={() => setSignOutModalOpen(true)}
              className={`rounded-none border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
                scrolled ? 'border-brand-mid text-brand-dark' : 'border-accent-light/60 text-accent-light'
              }`}
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className={`rounded-none border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
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
          className={`flex h-11 w-11 items-center justify-center rounded-none md:hidden ${
            headerSolid ? 'text-brand-dark' : 'text-accent-light'
          }`}
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
            {signedIn ? (
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-none bg-accent-primary/10 px-5 py-2.5 text-sm font-medium text-accent-primary transition-colors duration-300 hover:bg-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-accent-primary/10 text-xs font-bold text-accent-primary">
                  {getInitials(session?.user?.name ?? '')}
                </span>
                My Account
              </Link>
            ) : (
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-none bg-accent-primary px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Book a Court
                <span aria-hidden="true">→</span>
              </Link>
            )}
            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setSignOutModalOpen(true)
                }}
                className="block w-full rounded-none border border-brand-mid px-5 py-2.5 text-center text-sm font-semibold text-brand-dark transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-none border border-brand-mid px-5 py-2.5 text-center text-sm font-semibold text-brand-dark transition-colors duration-300 hover:border-accent-primary hover:bg-accent-primary hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={signOutModalOpen} onClose={() => setSignOutModalOpen(false)} title="Sign Out">
        <p className="text-sm text-brand-dark/70">
          You&apos;ll need to sign in again to access your account. Continue?
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setSignOutModalOpen(false)}
            disabled={isPending}
            className="rounded-none border border-brand-dark/15 px-3 py-1.5 text-sm font-medium text-brand-dark/70 hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => startTransition(handleSignOut)}
            disabled={isPending}
            className="rounded-none bg-accent-primary px-4 py-1.5 text-sm font-semibold text-brand-light hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Signing Out…' : 'Sign Out'}
          </button>
        </div>
      </Modal>
    </header>
  )
}
