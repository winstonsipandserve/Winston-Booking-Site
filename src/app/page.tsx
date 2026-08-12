import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import StatsBar from '@/components/home/StatsBar'
import ChooseYourSport from '@/components/home/ChooseYourSport'
import HowItWorks from '@/components/home/HowItWorks'
import Gallery from '@/components/home/Gallery'
import Testimonials from '@/components/home/Testimonials'
import CtaBanner from '@/components/home/CtaBanner'

export default async function Home() {
  const resourceTypes = await prisma.resourceType.findMany({
    include: { resources: { where: { isActive: true } } },
    orderBy: { name: 'asc' },
  })

  const totalResources = resourceTypes.reduce((sum, rt) => sum + rt.resources.length, 0)
  const sportCount = new Set(resourceTypes.map((rt) => rt.slug.split('_')[0])).size

  const resourceTypeCards = resourceTypes.map((rt) => ({
    id: rt.id,
    slug: rt.slug,
    name: rt.name,
    category: rt.category,
    resources: rt.resources.map((resource) => ({ id: resource.id, label: resource.label })),
  }))

  return (
    <>
      <Navbar />
      <Hero totalResources={totalResources} sportCount={sportCount} />
      <StatsBar totalResources={totalResources} sportCount={sportCount} />
      <ChooseYourSport resourceTypes={resourceTypeCards} />
      <HowItWorks />
      <Gallery />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </>
  )
}
