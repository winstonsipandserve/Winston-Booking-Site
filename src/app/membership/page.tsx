import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MembershipHero from '@/components/membership/MembershipHero'
import TierCards from '@/components/membership/TierCards'
import ApplicationProcess from '@/components/membership/ApplicationProcess'
import ApplyCta from '@/components/membership/ApplyCta'

export default function MembershipPage() {
  return (
    <>
      <Navbar />
      <MembershipHero />
      <TierCards />
      <ApplicationProcess />
      <ApplyCta />
      <Footer />
    </>
  )
}
