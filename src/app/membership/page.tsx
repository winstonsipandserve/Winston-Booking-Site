import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MembershipHero from '@/components/membership/MembershipHero'
import TierCards from '@/components/membership/TierCards'
import ApplicationProcess from '@/components/membership/ApplicationProcess'
import ApplyCta from '@/components/membership/ApplyCta'
import { foundingSeatsRemaining } from '@/lib/membership-founding'

// Reads the live Founding seat count, so never prerender.
export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const seatsRemaining = await foundingSeatsRemaining()
  return (
    <>
      <Navbar />
      <MembershipHero />
      <TierCards foundingSeatsRemaining={seatsRemaining} />
      <ApplicationProcess />
      <ApplyCta />
      <Footer />
    </>
  )
}
