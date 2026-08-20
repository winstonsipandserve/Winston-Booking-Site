import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CafeBarPageClient from '@/components/cafe-bar/CafeBarPageClient'
import HoursLocation from '@/components/cafe-bar/HoursLocation'

export default function CafeBarPage() {
  return (
    <>
      <Navbar />
      <CafeBarPageClient />
      <HoursLocation />
      <Footer />
    </>
  )
}
