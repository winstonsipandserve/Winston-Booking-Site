'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getInitials } from '@/components/account/AccountProfile'
import Modal from '@/components/ui/Modal'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

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
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signOutModalOpen, setSignOutModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const signedIn = status === 'authenticated' && session?.user?.role === 'member'

  function handleSignOut() {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0 text-lg font-semibold text-gray-900">
          Winston
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
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-gray-900 underline underline-offset-4' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {link.label}
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              {getInitials(session?.user?.name ?? '')}
            </Link>
          ) : (
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Book a Court
            </Link>
          )}
          {signedIn ? (
            <button
              type="button"
              onClick={() => setSignOutModalOpen(true)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          className="flex h-10 w-10 items-center justify-center text-gray-700 md:hidden"
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
        <div className="border-t border-gray-200 bg-white px-6 pb-6 md:hidden">
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
                    className={`text-base font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
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
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                  {getInitials(session?.user?.name ?? '')}
                </span>
                My Account
              </Link>
            ) : (
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
              >
                Book a Court
              </Link>
            )}
            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setSignOutModalOpen(true)
                }}
                className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={signOutModalOpen} onClose={() => setSignOutModalOpen(false)} title="Sign Out">
        <LoadingOverlay isOpen={isPending} label="Signing Out…" />
        <p className="text-sm text-gray-600">
          You&apos;ll need to sign in again to access your account. Continue?
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setSignOutModalOpen(false)}
            disabled={isPending}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => startTransition(handleSignOut)}
            disabled={isPending}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign Out
          </button>
        </div>
      </Modal>
    </header>
  )
}
