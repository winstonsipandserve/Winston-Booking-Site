import { prisma } from '@/lib/prisma'
import {
  BUSINESS_CLOSE_HOUR,
  BUSINESS_OPEN_HOUR,
  currentPhMonthWindow,
  currentPhWeekWindow,
  phDateToUtcWindow,
  phMonthStartUtc,
  toPhDateString,
  toPhMonthKey,
} from '@/lib/business-hours'
import { formatMembershipTier, formatShortDate } from '@/lib/format'

export interface DashboardStats {
  bookingsToday: number
  revenueThisMonthCentavos: number
  pendingApplications: number
  activeMemberships: number
  resourceUtilizationPct: number
}

export interface RevenueTrendPoint {
  month: string
  totalCentavos: number
  tennisCentavos: number
  pickleballCentavos: number
  golfCentavos: number
}

export interface MembershipTierTrendPoint {
  month: string
  threeMonthCentavos: number
  sixMonthCentavos: number
  twelveMonthCentavos: number
}

type Sport = 'tennis' | 'pickleball' | 'golf'

function sportForResourceType(slug: string): Sport | null {
  switch (slug) {
    case 'tennis_court':
    case 'tennis_sim':
      return 'tennis'
    case 'pickleball_court':
    case 'pickleball_sim':
      return 'pickleball'
    case 'golf_sim':
      return 'golf'
    default:
      return null
  }
}

export interface ResourceBreakdownEntry {
  resourceType: string
  count: number
}

export interface RecentBooking {
  reference: string
  sport: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export interface RecentApplication {
  name: string
  tier: string
  submitted: string
}

export interface DashboardData {
  stats: DashboardStats
  revenueTrend: RevenueTrendPoint[]
  membershipTierTrend: MembershipTierTrendPoint[]
  resourceBreakdown: ResourceBreakdownEntry[]
  recentBookings: RecentBooking[]
  recentApplications: RecentApplication[]
}

function formatTimeOnly(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  }).format(date)
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayWindow = phDateToUtcWindow(toPhDateString(new Date()))
  const monthWindow = currentPhMonthWindow()
  const weekWindow = currentPhWeekWindow()
  const twelveMonthsAgoStart = phMonthStartUtc(11)

  const [
    bookingsToday,
    revenueAgg,
    pendingApplications,
    activeMemberships,
    weekBookings,
    activeResourceCount,
    paymentsForRevenue,
    membershipPaymentsForRevenue,
    resourceGroupBy,
    recentBookingsRaw,
    recentApplicationsRaw,
  ] = await Promise.all([
    prisma.booking.count({
      where: { status: 'confirmed', startTime: { gte: todayWindow.start, lt: todayWindow.end } },
    }),
    prisma.payment.aggregate({
      _sum: { amountCentavos: true },
      where: { status: 'paid', paidAt: { gte: monthWindow.start, lt: monthWindow.end } },
    }),
    prisma.membershipApplication.count({ where: { status: 'pending' } }),
    prisma.membership.count({ where: { endDate: { gte: new Date() } } }),
    prisma.booking.findMany({
      where: {
        status: 'confirmed',
        startTime: { gte: weekWindow.start, lt: weekWindow.end },
        resource: { isActive: true },
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.resource.count({ where: { isActive: true } }),
    prisma.payment.findMany({
      where: { status: 'paid', paidAt: { gte: twelveMonthsAgoStart } },
      select: {
        amountCentavos: true,
        paidAt: true,
        booking: { select: { resource: { select: { resourceType: { select: { slug: true } } } } } },
      },
    }),
    prisma.membershipPayment.findMany({
      where: { status: 'paid', paidAt: { gte: twelveMonthsAgoStart } },
      select: { amountCentavos: true, paidAt: true, tier: true },
    }),
    prisma.booking.groupBy({
      by: ['resourceId'],
      where: { status: 'confirmed' },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { resource: { include: { resourceType: true } } },
      relationLoadStrategy: 'join',
    }),
    prisma.membershipApplication.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true },
    }),
  ])

  const bookedHours = weekBookings.reduce(
    (sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 3_600_000,
    0,
  )
  const utilizationDenominator = activeResourceCount * (BUSINESS_CLOSE_HOUR - BUSINESS_OPEN_HOUR) * 7
  const resourceUtilizationPct =
    utilizationDenominator > 0 ? Math.round((bookedHours / utilizationDenominator) * 100) : 0

  const stats: DashboardStats = {
    bookingsToday,
    revenueThisMonthCentavos: revenueAgg._sum.amountCentavos ?? 0,
    pendingApplications,
    activeMemberships,
    resourceUtilizationPct,
  }

  const revenueBuckets = new Map<
    string,
    { label: string; totalCentavos: number; tennisCentavos: number; pickleballCentavos: number; golfCentavos: number }
  >()
  for (let i = 11; i >= 0; i--) {
    const monthStart = phMonthStartUtc(i)
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Manila' }).format(monthStart)
    revenueBuckets.set(toPhMonthKey(monthStart), {
      label,
      totalCentavos: 0,
      tennisCentavos: 0,
      pickleballCentavos: 0,
      golfCentavos: 0,
    })
  }
  for (const p of paymentsForRevenue) {
    if (!p.paidAt) continue
    const bucket = revenueBuckets.get(toPhMonthKey(p.paidAt))
    if (!bucket) continue
    bucket.totalCentavos += p.amountCentavos
    const sport = p.booking ? sportForResourceType(p.booking.resource.resourceType.slug) : null
    if (sport === 'tennis') bucket.tennisCentavos += p.amountCentavos
    else if (sport === 'pickleball') bucket.pickleballCentavos += p.amountCentavos
    else if (sport === 'golf') bucket.golfCentavos += p.amountCentavos
  }
  const revenueTrend: RevenueTrendPoint[] = Array.from(revenueBuckets.values()).map((b) => ({
    month: b.label,
    totalCentavos: b.totalCentavos,
    tennisCentavos: b.tennisCentavos,
    pickleballCentavos: b.pickleballCentavos,
    golfCentavos: b.golfCentavos,
  }))

  const membershipTierBuckets = new Map<
    string,
    { label: string; threeMonthCentavos: number; sixMonthCentavos: number; twelveMonthCentavos: number }
  >()
  for (let i = 11; i >= 0; i--) {
    const monthStart = phMonthStartUtc(i)
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Manila' }).format(monthStart)
    membershipTierBuckets.set(toPhMonthKey(monthStart), {
      label,
      threeMonthCentavos: 0,
      sixMonthCentavos: 0,
      twelveMonthCentavos: 0,
    })
  }
  for (const p of membershipPaymentsForRevenue) {
    if (!p.paidAt) continue
    const bucket = membershipTierBuckets.get(toPhMonthKey(p.paidAt))
    if (!bucket) continue
    if (p.tier === 'three_month') bucket.threeMonthCentavos += p.amountCentavos
    else if (p.tier === 'six_month') bucket.sixMonthCentavos += p.amountCentavos
    else if (p.tier === 'twelve_month') bucket.twelveMonthCentavos += p.amountCentavos
  }
  const membershipTierTrend: MembershipTierTrendPoint[] = Array.from(membershipTierBuckets.values()).map((b) => ({
    month: b.label,
    threeMonthCentavos: b.threeMonthCentavos,
    sixMonthCentavos: b.sixMonthCentavos,
    twelveMonthCentavos: b.twelveMonthCentavos,
  }))

  const resourceIds = resourceGroupBy.map((g) => g.resourceId)
  const resources = resourceIds.length
    ? await prisma.resource.findMany({
        where: { id: { in: resourceIds } },
        include: { resourceType: true },
        relationLoadStrategy: 'join',
      })
    : []
  const resourceTypeNameById = new Map(resources.map((r) => [r.id, r.resourceType.name]))
  const breakdownCounts = new Map<string, number>()
  for (const g of resourceGroupBy) {
    const typeName = resourceTypeNameById.get(g.resourceId)
    if (!typeName) continue
    breakdownCounts.set(typeName, (breakdownCounts.get(typeName) ?? 0) + g._count._all)
  }
  const resourceBreakdown: ResourceBreakdownEntry[] = Array.from(breakdownCounts.entries())
    .map(([resourceType, count]) => ({ resourceType, count }))
    .sort((a, b) => b.count - a.count)

  const recentBookings: RecentBooking[] = recentBookingsRaw.map((b) => ({
    reference: b.id,
    sport: b.resource.resourceType.name,
    date: formatShortDate(b.startTime),
    time: formatTimeOnly(b.startTime),
    status: b.status === 'pending_payment' ? 'pending' : b.status,
  }))

  const recentApplications: RecentApplication[] = recentApplicationsRaw.map((a) => ({
    name: a.customer.name,
    tier: formatMembershipTier(a.requestedTier),
    submitted: formatShortDate(a.createdAt),
  }))

  return { stats, revenueTrend, membershipTierTrend, resourceBreakdown, recentBookings, recentApplications }
}
