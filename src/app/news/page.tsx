import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewsHero from '@/components/news/NewsHero'
import NewsGrid from '@/components/news/NewsGrid'

export default function NewsPage() {
  return (
    <>
      <Navbar />
      <NewsHero />
      <NewsGrid />
      <Footer />
    </>
  )
}
