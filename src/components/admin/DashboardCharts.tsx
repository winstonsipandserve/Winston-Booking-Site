'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCentavos } from '@/lib/format'
import { useIsDarkMode } from '@/hooks/useIsDarkMode'
import DashboardBookingCalendar from '@/components/admin/DashboardBookingCalendar'
import type { BookingCalendarData, RevenueTrendPoint, MembershipRevenueTrendPoint } from '@/lib/dashboard-data'

// Recharts takes colour strings, so the palette references the chart tokens declared in
// globals.css (`@theme static`); browsers resolve `var()` in SVG presentation attributes and
// inline styles alike, so the chart follows the token sheet instead of restating hex values.
const token = (name: string, dark: boolean) => `var(--color-chart-${name}${dark ? '-dark' : ''})`

function buildPalette(dark: boolean) {
  return {
    grid: token('grid', dark),
    axisTick: token('axis', dark),
    axisLine: token('grid', dark),
    tooltipBg: token('surface', dark),
    tooltipBorder: token('grid', dark),
    legendText: token('axis', dark),
    revenueLine: token('primary', dark),
    sportColors: { tennis: token('primary', dark), pickleball: token('secondary', dark), golf: token('accent', dark) },
    membershipTierColors: { player: token('tier-player', dark), premier: token('tier-premier', dark), elite: token('tier-elite', dark) },
    topUpColor: token('topup', dark),
  }
}

const LIGHT_PALETTE = buildPalette(false)
const DARK_PALETTE = buildPalette(true)

type RangeOption = '3mo' | '6mo' | '12mo' | 'ytd'
type RevenueView = 'booking' | 'membership'
type BreakdownOption = 'total' | 'by-resource-type' | 'by-tier' | 'top-ups'

const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '3mo', label: '3mo' },
  { value: '6mo', label: '6mo' },
  { value: '12mo', label: '12mo' },
  { value: 'ytd', label: 'YTD' },
]

const VIEW_OPTIONS: { value: RevenueView; label: string }[] = [
  { value: 'booking', label: 'Booking' },
  { value: 'membership', label: 'Membership' },
]

const BOOKING_BREAKDOWN_OPTIONS: { value: BreakdownOption; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'by-resource-type', label: 'By Resource Type' },
]

const MEMBERSHIP_BREAKDOWN_OPTIONS: { value: BreakdownOption; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'by-tier', label: 'By Tier' },
  { value: 'top-ups', label: 'Top-Ups' },
]

// Shared shape for the "Total" area, common to both RevenueTrendPoint and
// MembershipRevenueTrendPoint — lets the single Total AreaChart branch below accept
// either trend array without recharts' generic inferring an incompatible union type.
interface TotalTrendPoint {
  month: string
  totalCentavos: number
}

function filterByRange<T extends { month: string }>(data: T[], range: RangeOption): T[] {
  if (range === '3mo') return data.slice(-3)
  if (range === '6mo') return data.slice(-6)
  if (range === '12mo') return data
  const currentYear = new Date().getFullYear()
  const janIndex = data.findIndex((_, i) => {
    const monthsFromEnd = data.length - 1 - i
    const d = new Date()
    d.setMonth(d.getMonth() - monthsFromEnd)
    return d.getFullYear() === currentYear && d.getMonth() === 0
  })
  return janIndex === -1 ? data : data.slice(janIndex)
}

interface DashboardChartsProps {
  revenueTrend: RevenueTrendPoint[]
  membershipRevenueTrend: MembershipRevenueTrendPoint[]
  bookingCalendar: BookingCalendarData
}

export default function DashboardCharts({ revenueTrend, membershipRevenueTrend, bookingCalendar }: DashboardChartsProps) {
  const isDark = useIsDarkMode()
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE
  const [range, setRange] = useState<RangeOption>('6mo')
  const [view, setView] = useState<RevenueView>('booking')
  const [breakdown, setBreakdown] = useState<BreakdownOption>('total')

  function handleViewChange(nextView: RevenueView) {
    setView(nextView)
    setBreakdown('total')
  }

  const filteredRevenueTrend = useMemo(() => filterByRange(revenueTrend, range), [revenueTrend, range])
  const filteredMembershipRevenueTrend = useMemo(
    () => filterByRange(membershipRevenueTrend, range),
    [membershipRevenueTrend, range],
  )

  const breakdownOptions = view === 'booking' ? BOOKING_BREAKDOWN_OPTIONS : MEMBERSHIP_BREAKDOWN_OPTIONS
  const chartTitle = view === 'booking' ? 'Booking Revenue Trend' : 'Membership Revenue Trend'
  const totalTrendData: TotalTrendPoint[] = view === 'booking' ? filteredRevenueTrend : filteredMembershipRevenueTrend

  const tooltipStyle = {
    backgroundColor: palette.tooltipBg,
    border: `1px solid ${palette.tooltipBorder}`,
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{chartTitle}</h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleViewChange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === opt.value
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    range === opt.value
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {breakdownOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBreakdown(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    breakdown === opt.value
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'membership' && breakdown === 'by-tier' ? (
              <AreaChart data={filteredMembershipRevenueTrend}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCentavos(value)}
                  width={90}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatCentavos(Number(value)), name]}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: palette.legendText }} />
                <Area
                  type="monotone"
                  dataKey="playerCentavos"
                  stackId="tier"
                  stroke={palette.membershipTierColors.player}
                  fill={palette.membershipTierColors.player}
                  fillOpacity={0.7}
                  name="Winston Player"
                />
                <Area
                  type="monotone"
                  dataKey="premierCentavos"
                  stackId="tier"
                  stroke={palette.membershipTierColors.premier}
                  fill={palette.membershipTierColors.premier}
                  fillOpacity={0.7}
                  name="Winston Premier"
                />
                <Area
                  type="monotone"
                  dataKey="eliteCentavos"
                  stackId="tier"
                  stroke={palette.membershipTierColors.elite}
                  fill={palette.membershipTierColors.elite}
                  fillOpacity={0.7}
                  name="Winston Elite"
                />
              </AreaChart>
            ) : view === 'membership' && breakdown === 'top-ups' ? (
              <AreaChart data={filteredMembershipRevenueTrend}>
                <defs>
                  <linearGradient id="topUpFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.topUpColor} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={palette.topUpColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCentavos(value)}
                  width={90}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatCentavos(Number(value)), name]}
                />
                <Area
                  type="monotone"
                  dataKey="topUpCentavos"
                  stroke={palette.topUpColor}
                  strokeWidth={2}
                  fill="url(#topUpFill)"
                  name="Top-Ups"
                />
              </AreaChart>
            ) : view === 'booking' && breakdown === 'by-resource-type' ? (
              <AreaChart data={filteredRevenueTrend}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCentavos(value)}
                  width={90}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatCentavos(Number(value)), name]}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: palette.legendText }} />
                <Area
                  type="monotone"
                  dataKey="tennisCentavos"
                  stackId="sport"
                  stroke={palette.sportColors.tennis}
                  fill={palette.sportColors.tennis}
                  fillOpacity={0.7}
                  name="Tennis"
                />
                <Area
                  type="monotone"
                  dataKey="pickleballCentavos"
                  stackId="sport"
                  stroke={palette.sportColors.pickleball}
                  fill={palette.sportColors.pickleball}
                  fillOpacity={0.7}
                  name="Pickleball"
                />
                <Area
                  type="monotone"
                  dataKey="golfCentavos"
                  stackId="sport"
                  stroke={palette.sportColors.golf}
                  fill={palette.sportColors.golf}
                  fillOpacity={0.7}
                  name="Golf"
                />
              </AreaChart>
            ) : (
              <AreaChart data={totalTrendData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.revenueLine} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={palette.revenueLine} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: palette.axisTick, fontSize: 11 }}
                  axisLine={{ stroke: palette.axisLine }}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCentavos(value)}
                  width={90}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatCentavos(Number(value)), name]}
                />
                <Area
                  type="monotone"
                  dataKey="totalCentavos"
                  stroke={palette.revenueLine}
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  name="Revenue"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <DashboardBookingCalendar initialCalendar={bookingCalendar} />
    </div>
  )
}
