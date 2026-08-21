'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Reveal from '@/components/ui/Reveal'
import AccountProfile, { SAMPLE_PROFILE } from '@/components/account/AccountProfile'
import MembershipStatusCard from '@/components/account/MembershipStatusCard'
import RecentBookingsList from '@/components/account/RecentBookingsList'

const FIRST_NAME = SAMPLE_PROFILE.name.split(' ')[0]

export default function AccountPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('winston_member_session') !== 'true') {
      router.push('/login')
      return
    }
    setChecked(true)
  }, [router])

  function handleSignOut() {
    sessionStorage.removeItem('winston_member_session')
    router.push('/')
  }

  if (!checked) return null

  return (
    <>
      <Navbar />

      <section className="bg-brand-light pt-32 pb-10 md:pt-40 md:pb-14">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">Member Portal</p>
          <h1 className="mt-4 font-serif text-3xl text-brand-dark md:text-4xl">
            Welcome back, {FIRST_NAME}
          </h1>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 md:px-10">
          <Reveal>
            <AccountProfile />
          </Reveal>
          <Reveal delayMs={100}>
            <MembershipStatusCard />
          </Reveal>
          <Reveal delayMs={200}>
            <RecentBookingsList />
          </Reveal>

          <button
            type="button"
            onClick={handleSignOut}
            className="self-start rounded-lg border border-brand-dark/20 px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-dark/70 transition-colors duration-300 hover:bg-brand-dark/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            Sign Out
          </button>
        </div>
      </section>

      <Footer />
    </>
  )
}
