// Hardcoded mock data for the admin Dashboard tab. Every export below is a
// placeholder standing in for a real Prisma query — see the per-export
// comment for its future source, following StatsBar.tsx's
// TOTAL_RESOURCES/SPORT_COUNT comment convention.

export interface DashboardStats {
  bookingsToday: number
  revenueThisMonthCentavos: number
  pendingApplications: number
  activeMemberships: number
  resourceUtilizationPct: number
}

// Future source:
// - bookingsToday: Booking.count({ where: { createdAt: { gte: startOfToday } } })
// - revenueThisMonthCentavos: Payment.aggregate({ _sum: { amountCentavos: true }, where: { paidAt: { gte: startOfMonth }, status: 'paid' } })
// - pendingApplications: MembershipApplication.count({ where: { status: 'pending' } })
// - activeMemberships: Membership.count({ where: { endDate: { gte: now } } })
// - resourceUtilizationPct: derived from Booking hours booked vs. Resource open hours over a trailing window
export const DASHBOARD_STATS: DashboardStats = {
  bookingsToday: 14,
  revenueThisMonthCentavos: 18_452_000,
  pendingApplications: 6,
  activeMemberships: 132,
  resourceUtilizationPct: 68,
}

export interface BookingsTrendPoint {
  date: string
  confirmed: number
  pending: number
  cancelled: number
}

// Future source: Booking.groupBy(['createdAt', 'status']) bucketed by day over the last 14 days
export const BOOKINGS_TREND: BookingsTrendPoint[] = [
  { date: 'Aug 15', confirmed: 18, pending: 3, cancelled: 1 },
  { date: 'Aug 16', confirmed: 22, pending: 2, cancelled: 2 },
  { date: 'Aug 17', confirmed: 15, pending: 4, cancelled: 0 },
  { date: 'Aug 18', confirmed: 20, pending: 3, cancelled: 1 },
  { date: 'Aug 19', confirmed: 25, pending: 5, cancelled: 2 },
  { date: 'Aug 20', confirmed: 28, pending: 4, cancelled: 1 },
  { date: 'Aug 21', confirmed: 24, pending: 2, cancelled: 3 },
  { date: 'Aug 22', confirmed: 19, pending: 3, cancelled: 1 },
  { date: 'Aug 23', confirmed: 21, pending: 6, cancelled: 0 },
  { date: 'Aug 24', confirmed: 26, pending: 3, cancelled: 2 },
  { date: 'Aug 25', confirmed: 23, pending: 2, cancelled: 1 },
  { date: 'Aug 26', confirmed: 17, pending: 4, cancelled: 1 },
  { date: 'Aug 27', confirmed: 20, pending: 3, cancelled: 0 },
  { date: 'Aug 28', confirmed: 14, pending: 5, cancelled: 1 },
]

export interface RevenueTrendPoint {
  month: string
  revenueCentavos: number
}

// Future source: Payment.groupBy(['paidAt'], { _sum: { amountCentavos: true } }) bucketed by month over the last 6 months
export const REVENUE_TREND: RevenueTrendPoint[] = [
  { month: 'Mar', revenueCentavos: 12_100_000 },
  { month: 'Apr', revenueCentavos: 13_850_000 },
  { month: 'May', revenueCentavos: 15_200_000 },
  { month: 'Jun', revenueCentavos: 14_600_000 },
  { month: 'Jul', revenueCentavos: 16_900_000 },
  { month: 'Aug', revenueCentavos: 18_452_000 },
]

export interface ResourceBreakdownEntry {
  resourceType: string
  count: number
}

// Future source: Booking.groupBy(['resourceId']) joined to Resource.resourceType, counts weighted roughly to the 1/3/1/2/2 inventory skew
export const RESOURCE_BREAKDOWN: ResourceBreakdownEntry[] = [
  { resourceType: 'Pickleball Courts', count: 142 },
  { resourceType: 'Golf Simulators', count: 98 },
  { resourceType: 'Pickleball Simulators', count: 76 },
  { resourceType: 'Tennis Court', count: 54 },
  { resourceType: 'Tennis Simulator', count: 31 },
]

export interface RecentBooking {
  reference: string
  sport: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

// Future source: Booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
export const RECENT_BOOKINGS: RecentBooking[] = [
  { reference: 'cm8x2k9a10001', sport: 'Pickleball Court', date: 'Aug 28', time: '4:00 PM', status: 'confirmed' },
  { reference: 'cm8x2j7z10002', sport: 'Golf Simulator', date: 'Aug 28', time: '2:30 PM', status: 'pending' },
  { reference: 'cm8x2h3q10003', sport: 'Tennis Court', date: 'Aug 28', time: '9:00 AM', status: 'confirmed' },
  { reference: 'cm8x2g1w10004', sport: 'Pickleball Simulator', date: 'Aug 27', time: '7:00 PM', status: 'cancelled' },
  { reference: 'cm8x2f8m10005', sport: 'Golf Simulator', date: 'Aug 27', time: '5:30 PM', status: 'confirmed' },
]

export interface RecentApplication {
  name: string
  tier: string
  submitted: string
}

// Future source: MembershipApplication.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 5 })
export const RECENT_APPLICATIONS: RecentApplication[] = [
  { name: 'Marco Villanueva', tier: '12-Month', submitted: 'Aug 27' },
  { name: 'Denise Aquino', tier: '6-Month', submitted: 'Aug 27' },
  { name: 'Paolo Reyes', tier: '3-Month', submitted: 'Aug 26' },
  { name: 'Carla Mendoza', tier: '12-Month', submitted: 'Aug 25' },
  { name: 'Ito Bautista', tier: '6-Month', submitted: 'Aug 24' },
]
