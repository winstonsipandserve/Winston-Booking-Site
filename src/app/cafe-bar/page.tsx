import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CafeBarHero from '@/components/cafe-bar/CafeBarHero'
import MenuHighlights from '@/components/cafe-bar/MenuHighlights'
import SpeakeasyFeature from '@/components/cafe-bar/SpeakeasyFeature'
import Gallery from '@/components/cafe-bar/Gallery'
import HoursLocation from '@/components/cafe-bar/HoursLocation'

export default function CafeBarPage() {
  return (
    <>
      <Navbar />
      <CafeBarHero />
      <MenuHighlights />
      <SpeakeasyFeature />
      <Gallery />
      <HoursLocation />
      <Footer />
    </>
  )
}
