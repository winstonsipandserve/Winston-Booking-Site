import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AboutHero from '@/components/about/AboutHero'
import OurStory from '@/components/about/OurStory'
import Values from '@/components/about/Values'
import AboutCta from '@/components/about/AboutCta'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <AboutHero />
      <OurStory />
      <Values />
      <AboutCta />
      <Footer />
    </>
  )
}
