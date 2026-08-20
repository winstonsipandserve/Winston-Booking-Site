import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import StatsBar from '@/components/home/StatsBar'
import HowItWorks from '@/components/home/HowItWorks'
import TwoSides from '@/components/home/TwoSides'
import Facilities from '@/components/home/Facilities'
import CtaBanner from '@/components/home/CtaBanner'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <TwoSides />
      <Facilities />
      <CtaBanner />
      <Footer />
    </>
  )
}
