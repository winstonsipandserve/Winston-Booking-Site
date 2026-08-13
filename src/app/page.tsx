import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import StatsBar from '@/components/home/StatsBar'
import HowItWorks from '@/components/home/HowItWorks'
import Facilities from '@/components/home/Facilities'
import CtaBanner from '@/components/home/CtaBanner'

export default async function Home() {
  const resourceTypes = await prisma.resourceType.findMany({
    include: { resources: { where: { isActive: true } } },
  })

  const totalResources = resourceTypes.reduce((sum, rt) => sum + rt.resources.length, 0)
  const sportCount = new Set(resourceTypes.map((rt) => rt.slug.split('_')[0])).size

  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar totalResources={totalResources} sportCount={sportCount} />
      <HowItWorks />
      <Facilities />
      <CtaBanner />
      <Footer />
    </>
  )
}
