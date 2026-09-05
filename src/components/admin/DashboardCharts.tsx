'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import type { BookingsTrendPoint, RevenueTrendPoint, ResourceBreakdownEntry } from '@/lib/dashboard-data'

const LIGHT_PALETTE = {
  grid: '#e5e7eb',
  axisTick: '#6b7280',
  axisLine: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  legendText: '#6b7280',
  barConfirmed: '#111827',
  barPending: '#6b7280',
  barCancelled: '#d1d5db',
  revenueLine: '#111827',
  resourceColors: ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db'],
}

const DARK_PALETTE = {
  grid: '#374151',
  axisTick: '#9ca3af',
  axisLine: '#374151',
  tooltipBg: '#1f2937',
  tooltipBorder: '#374151',
  legendText: '#9ca3af',
  barConfirmed: '#f3f4f6',
  barPending: '#9ca3af',
  barCancelled: '#4b5563',
  revenueLine: '#f3f4f6',
  resourceColors: ['#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563'],
}

interface DashboardChartsProps {
  bookingsTrend: BookingsTrendPoint[]
  revenueTrend: RevenueTrendPoint[]
  resourceBreakdown: ResourceBreakdownEntry[]
}

export default function DashboardCharts({ bookingsTrend, revenueTrend, resourceBreakdown }: DashboardChartsProps) {
  const isDark = useIsDarkMode()
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE

  const tooltipStyle = {
    backgroundColor: palette.tooltipBg,
    border: `1px solid ${palette.tooltipBorder}`,
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Bookings Trend (Last 14 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bookingsTrend}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: palette.axisTick, fontSize: 11 }}
                axisLine={{ stroke: palette.axisLine }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: palette.axisTick, fontSize: 11 }}
                axisLine={{ stroke: palette.axisLine }}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: palette.legendText }} />
              <Bar dataKey="confirmed" stackId="a" fill={palette.barConfirmed} name="Confirmed" />
              <Bar dataKey="pending" stackId="a" fill={palette.barPending} name="Pending" />
              <Bar dataKey="cancelled" stackId="a" fill={palette.barCancelled} name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Trend (Last 6 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
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
                  formatter={(value) => [formatCentavos(Number(value)), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenueCentavos"
                  stroke={palette.revenueLine}
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  name="Revenue"
                />
              </AreaChart>
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
    </div>
  )
}
