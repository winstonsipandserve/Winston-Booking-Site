import { getActiveAdminSession } from '@/lib/admin-session'
import { formatMembershipTier, formatBookingDateTime } from '@/lib/format'
import { getMembershipDisplayStatus, MEMBERSHIP_DISPLAY_STATUS_LABELS } from '@/lib/membership-display-status'
import { isMembershipDisplayStatusFilter, getMembershipApplicationsForFilter } from '@/lib/memberships-query'
import { buildCsv } from '@/lib/csv'
import { toPhDateString } from '@/lib/business-hours'

export async function GET(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') ?? 'all'
  const filter = isMembershipDisplayStatusFilter(statusParam) ? statusParam : 'all'

  const { applications, latestMembershipsByCustomer } = await getMembershipApplicationsForFilter(filter)

  const headers = ['Applicant', 'Email', 'Phone', 'Requested Tier', 'Status', 'Submitted', 'Reviewed By']
  const rows = applications.map((a) => {
    const displayStatus = getMembershipDisplayStatus({
      status: a.status,
      latestMembership: latestMembershipsByCustomer.get(a.customerId) ?? null,
    })
    return [
      a.customer.name,
      a.customer.email,
      a.customer.phone,
      formatMembershipTier(a.requestedTier),
      MEMBERSHIP_DISPLAY_STATUS_LABELS[displayStatus],
      formatBookingDateTime(a.createdAt),
      a.reviewedBy?.name ?? '',
    ]
  })

  const csv = buildCsv(headers, rows)
  const dateStr = toPhDateString(new Date())
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="memberships-export-${dateStr}.csv"`,
    },
  })
}
