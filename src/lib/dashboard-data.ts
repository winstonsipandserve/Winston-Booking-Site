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

export interface BookingsTrendPoint {
  date: string
  confirmed: number
  pending: number
  cancelled: number
}

export interface RevenueTrendPoint {
  month: string
  revenueCentavos: number
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
  bookingsTrend: BookingsTrendPoint[]
  revenueTrend: RevenueTrendPoint[]
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
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const sixMonthsAgoStart = phMonthStartUtc(5)

  const [
    bookingsToday,
    revenueAgg,
    pendingApplications,
    activeMemberships,
    weekBookings,
    activeResourceCount,
    bookingsForTrend,
    paymentsForRevenue,
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
    prisma.booking.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, status: true },
    }),
    prisma.payment.findMany({
      where: { status: 'paid', paidAt: { gte: sixMonthsAgoStart } },
      select: { amountCentavos: true, paidAt: true },
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

  const trendBuckets = new Map<string, BookingsTrendPoint>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    trendBuckets.set(toPhDateString(d), { date: formatShortDate(d), confirmed: 0, pending: 0, cancelled: 0 })
  }
  for (const b of bookingsForTrend) {
    const bucket = trendBuckets.get(toPhDateString(b.createdAt))
    if (!bucket) continue
    if (b.status === 'confirmed') bucket.confirmed++
    else if (b.status === 'pending_payment') bucket.pending++
    else if (b.status === 'cancelled') bucket.cancelled++
  }
  const bookingsTrend = Array.from(trendBuckets.values())

  const revenueBuckets = new Map<string, { label: string; revenueCentavos: number }>()
  for (let i = 5; i >= 0; i--) {
    const monthStart = phMonthStartUtc(i)
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Manila' }).format(monthStart)
    revenueBuckets.set(toPhMonthKey(monthStart), { label, revenueCentavos: 0 })
  }
  for (const p of paymentsForRevenue) {
    if (!p.paidAt) continue
    const bucket = revenueBuckets.get(toPhMonthKey(p.paidAt))
    if (bucket) bucket.revenueCentavos += p.amountCentavos
  }
  const revenueTrend: RevenueTrendPoint[] = Array.from(revenueBuckets.values()).map((b) => ({
    month: b.label,
    revenueCentavos: b.revenueCentavos,
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

  return { stats, bookingsTrend, revenueTrend, resourceBreakdown, recentBookings, recentApplications }
}
