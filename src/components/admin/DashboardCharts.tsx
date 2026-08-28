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
import { BOOKINGS_TREND, REVENUE_TREND, RESOURCE_BREAKDOWN } from '@/lib/dashboard-mock-data'

const RESOURCE_COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db']

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
}

export default function DashboardCharts() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Bookings Trend (Last 14 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={BOOKINGS_TREND}>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#6b7280' }} />
              <Bar dataKey="confirmed" stackId="a" fill="#111827" name="Confirmed" />
              <Bar dataKey="pending" stackId="a" fill="#6b7280" name="Pending" />
              <Bar dataKey="cancelled" stackId="a" fill="#d1d5db" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Revenue Trend (Last 6 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_TREND}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111827" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCentavos(value)}
                  width={90}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCentavos(Number(value)), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenueCentavos" stroke="#111827" strokeWidth={2} fill="url(#revenueFill)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Bookings by Resource Type</h2>
          <div className="flex h-64 items-center gap-4">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={RESOURCE_BREAKDOWN}
                    dataKey="count"
                    nameKey="resourceType"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {RESOURCE_BREAKDOWN.map((entry, index) => (
                      <Cell key={entry.resourceType} fill={RESOURCE_COLORS[index % RESOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex shrink-0 flex-col gap-1.5">
              {RESOURCE_BREAKDOWN.map((entry, index) => (
                <li key={entry.resourceType} className="flex items-center gap-2 text-xs text-gray-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: RESOURCE_COLORS[index % RESOURCE_COLORS.length] }}
                  />
                  <span className="text-gray-900">{entry.resourceType}</span>
                  <span className="text-gray-500">({entry.count})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
