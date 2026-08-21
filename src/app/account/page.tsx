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

  if (!checked) return null

  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <p className="text-sm uppercase tracking-[0.3em] text-accent-light/90">Member Portal</p>
          <h1 className="mt-4 font-serif text-3xl text-brand-light md:text-4xl">
            Welcome back, {FIRST_NAME}
          </h1>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[320px_1fr] md:items-start md:px-10">
          <div className="flex flex-col gap-8">
            <Reveal>
              <AccountProfile />
            </Reveal>

            {/* Intentionally inert placeholder — no href/onClick — until member-aware pricing is designed and wired into the booking flow. */}
            <div className="flex flex-col items-center gap-1.5 rounded-lg bg-accent-primary px-6 py-2.5 text-center text-sm font-medium uppercase tracking-wide text-brand-light">
              Book a Court
              <span className="text-xs font-normal normal-case tracking-normal text-brand-light/70">
                Member pricing — coming soon
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <Reveal delayMs={100}>
              <MembershipStatusCard />
            </Reveal>
          </div>

          <div className="flex flex-col gap-8 md:col-span-2">
            <Reveal delayMs={200}>
              <RecentBookingsList />
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
