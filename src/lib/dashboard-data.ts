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
  bookingRevenueThisMonthCentavos: number
  membershipRevenueThisMonthCentavos: number
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

export interface MembershipRevenueTrendPoint {
  month: string
  threeMonthCentavos: number
  sixMonthCentavos: number
  twelveMonthCentavos: number
  topUpCentavos: number
  totalCentavos: number
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

export interface BookingCalendarEntry {
  date: string
  count: number
}

export interface BookingCalendarData {
  month: string
  bookings: BookingCalendarEntry[]
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
  membershipRevenueTrend: MembershipRevenueTrendPoint[]
  bookingCalendar: BookingCalendarData
  recentBookings: RecentBooking[]
  recentApplications: RecentApplication[]
}

const PH_MONTH_PATTERN = /^([1-9]\d{3})-(0[1-9]|1[0-2])$/

export function isPhMonthKey(value: string): boolean {
  return PH_MONTH_PATTERN.test(value)
}

function phMonthWindowForKey(month: string): { start: Date; end: Date } {
  const match = PH_MONTH_PATTERN.exec(month)
  if (!match) throw new Error('month must be in YYYY-MM format')

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  return {
    start: new Date(Date.UTC(year, monthIndex, 1, -8, 0, 0)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1, -8, 0, 0)),
  }
}

export async function getConfirmedBookingCalendar(month: string): Promise<BookingCalendarData> {
  const window = phMonthWindowForKey(month)
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      startTime: { gte: window.start, lt: window.end },
    },
    select: { startTime: true },
  })

  const countsByDate = new Map<string, number>()
  for (const booking of bookings) {
    const date = toPhDateString(booking.startTime)
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1)
  }

  return {
    month,
    bookings: Array.from(countsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
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
  const bookingCalendarMonth = toPhMonthKey(new Date())

  const [
    bookingsToday,
    bookingRevenueAgg,
    membershipPaymentRevenueAgg,
    membershipTopUpRevenueAgg,
    pendingApplications,
    activeMemberships,
    weekBookings,
    activeResourceCount,
    paymentsForRevenue,
    membershipPaymentsForRevenue,
    membershipTopUpPaymentsForRevenue,
    bookingCalendar,
    recentBookingsRaw,
    recentApplicationsRaw,
  ] = await Promise.all([
    prisma.booking.count({
      where: { status: 'confirmed', startTime: { gte: todayWindow.start, lt: todayWindow.end } },
    }),
    prisma.payment.aggregate({
      _sum: { amountCentavos: true },
      where: { status: 'paid', bookingId: { not: null }, paidAt: { gte: monthWindow.start, lt: monthWindow.end } },
    }),
    prisma.membershipPayment.aggregate({
      _sum: { amountCentavos: true },
      where: { status: 'paid', paidAt: { gte: monthWindow.start, lt: monthWindow.end } },
    }),
    prisma.payment.aggregate({
      _sum: { amountCentavos: true },
      where: { status: 'paid', membershipId: { not: null }, paidAt: { gte: monthWindow.start, lt: monthWindow.end } },
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
      where: { status: 'paid', bookingId: { not: null }, paidAt: { gte: twelveMonthsAgoStart } },
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
    prisma.payment.findMany({
      where: { status: 'paid', membershipId: { not: null }, paidAt: { gte: twelveMonthsAgoStart } },
      select: { amountCentavos: true, paidAt: true },
    }),
    getConfirmedBookingCalendar(bookingCalendarMonth),
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
    bookingRevenueThisMonthCentavos: bookingRevenueAgg._sum.amountCentavos ?? 0,
    membershipRevenueThisMonthCentavos:
      (membershipPaymentRevenueAgg._sum.amountCentavos ?? 0) +
      (membershipTopUpRevenueAgg._sum.amountCentavos ?? 0),
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

  const membershipRevenueBuckets = new Map<
    string,
    {
      label: string
      threeMonthCentavos: number
      sixMonthCentavos: number
      twelveMonthCentavos: number
      topUpCentavos: number
    }
  >()
  for (let i = 11; i >= 0; i--) {
    const monthStart = phMonthStartUtc(i)
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Manila' }).format(monthStart)
    membershipRevenueBuckets.set(toPhMonthKey(monthStart), {
      label,
      threeMonthCentavos: 0,
      sixMonthCentavos: 0,
      twelveMonthCentavos: 0,
      topUpCentavos: 0,
    })
  }
  for (const p of membershipPaymentsForRevenue) {
    if (!p.paidAt) continue
    const bucket = membershipRevenueBuckets.get(toPhMonthKey(p.paidAt))
    if (!bucket) continue
    if (p.tier === 'three_month') bucket.threeMonthCentavos += p.amountCentavos
    else if (p.tier === 'six_month') bucket.sixMonthCentavos += p.amountCentavos
    else if (p.tier === 'twelve_month') bucket.twelveMonthCentavos += p.amountCentavos
  }
  for (const p of membershipTopUpPaymentsForRevenue) {
    if (!p.paidAt) continue
    const bucket = membershipRevenueBuckets.get(toPhMonthKey(p.paidAt))
    if (!bucket) continue
    bucket.topUpCentavos += p.amountCentavos
  }
  const membershipRevenueTrend: MembershipRevenueTrendPoint[] = Array.from(membershipRevenueBuckets.values()).map(
    (b) => ({
      month: b.label,
      threeMonthCentavos: b.threeMonthCentavos,
      sixMonthCentavos: b.sixMonthCentavos,
      twelveMonthCentavos: b.twelveMonthCentavos,
      topUpCentavos: b.topUpCentavos,
      totalCentavos: b.threeMonthCentavos + b.sixMonthCentavos + b.twelveMonthCentavos + b.topUpCentavos,
    }),
  )

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

  return { stats, revenueTrend, membershipRevenueTrend, bookingCalendar, recentBookings, recentApplications }
}
