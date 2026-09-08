'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCentavos } from '@/lib/format'
import { useIsDarkMode } from '@/hooks/useIsDarkMode'
import type { RevenueTrendPoint, MembershipTierTrendPoint, ResourceBreakdownEntry } from '@/lib/dashboard-data'

const LIGHT_PALETTE = {
  grid: '#e5e7eb',
  axisTick: '#6b7280',
  axisLine: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  legendText: '#6b7280',
  revenueLine: '#111827',
  resourceColors: ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db'],
  sportColors: { tennis: '#111827', pickleball: '#6b7280', golf: '#cd1818' },
  membershipTierColors: { threeMonth: '#2563eb', sixMonth: '#d97706', twelveMonth: '#7c3aed' },
}

const DARK_PALETTE = {
  grid: '#374151',
  axisTick: '#9ca3af',
  axisLine: '#374151',
  tooltipBg: '#1f2937',
  tooltipBorder: '#374151',
  legendText: '#9ca3af',
  revenueLine: '#f3f4f6',
  resourceColors: ['#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563'],
  sportColors: { tennis: '#f3f4f6', pickleball: '#9ca3af', golf: '#f87171' },
  membershipTierColors: { threeMonth: '#60a5fa', sixMonth: '#fbbf24', twelveMonth: '#a78bfa' },
}

type RangeOption = '3mo' | '6mo' | '12mo' | 'ytd'
type BreakdownOption = 'total' | 'by-resource-type' | 'by-membership-tier'

const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '3mo', label: '3mo' },
  { value: '6mo', label: '6mo' },
  { value: '12mo', label: '12mo' },
  { value: 'ytd', label: 'YTD' },
]

const BREAKDOWN_OPTIONS: { value: BreakdownOption; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'by-resource-type', label: 'By Resource Type' },
  { value: 'by-membership-tier', label: 'By Membership Tier' },
]

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
  membershipTierTrend: MembershipTierTrendPoint[]
  resourceBreakdown: ResourceBreakdownEntry[]
}

export default function DashboardCharts({ revenueTrend, membershipTierTrend, resourceBreakdown }: DashboardChartsProps) {
  const isDark = useIsDarkMode()
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE
  const [range, setRange] = useState<RangeOption>('6mo')
  const [breakdown, setBreakdown] = useState<BreakdownOption>('total')

  const filteredRevenueTrend = useMemo(() => filterByRange(revenueTrend, range), [revenueTrend, range])
  const filteredMembershipTierTrend = useMemo(
    () => filterByRange(membershipTierTrend, range),
    [membershipTierTrend, range],
  )

  const tooltipStyle = {
    backgroundColor: palette.tooltipBg,
    border: `1px solid ${palette.tooltipBorder}`,
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Trend</h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
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
              {BREAKDOWN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBreakdown(opt.value)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
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
            {breakdown === 'by-membership-tier' ? (
              <AreaChart data={filteredMembershipTierTrend}>
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
                  dataKey="threeMonthCentavos"
                  stackId="tier"
                  stroke={palette.membershipTierColors.threeMonth}
                  fill={palette.membershipTierColors.threeMonth}
                  fillOpacity={0.7}
                  name="3-Month"
                />
                <Area
                  type="monotone"
                  dataKey="sixMonthCentavos"
                  stackId="tier"
                  stroke={palette.membershipTierColors.sixMonth}
                  fill={palette.membershipTierColors.sixMonth}
                  fillOpacity={0.7}
                  name="6-Month"
                />
                <Area
                  type="monotone"
                  dataKey="twelveMonthCentavos"
                  stackId="tier"
                  stroke={palette.membershipTierColors.twelveMonth}
                  fill={palette.membershipTierColors.twelveMonth}
                  fillOpacity={0.7}
                  name="12-Month"
                />
              </AreaChart>
            ) : (
              <AreaChart data={filteredRevenueTrend}>
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
                {breakdown === 'total' ? (
                  <Area
                    type="monotone"
                    dataKey="totalCentavos"
                    stroke={palette.revenueLine}
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                    name="Revenue"
                  />
                ) : (
                  <>
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
                  </>
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Bookings by Resource Type</h2>
        <div className="flex h-64 items-center gap-4">
          <div className="h-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceBreakdown}
                  dataKey="count"
                  nameKey="resourceType"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                >
                  {resourceBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.resourceType}
                      fill={palette.resourceColors[index % palette.resourceColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex shrink-0 flex-col gap-1.5">
            {resourceBreakdown.map((entry, index) => (
              <li key={entry.resourceType} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: palette.resourceColors[index % palette.resourceColors.length] }}
                />
                <span className="text-gray-900 dark:text-gray-100">{entry.resourceType}</span>
                <span className="text-gray-500 dark:text-gray-400">({entry.count})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
