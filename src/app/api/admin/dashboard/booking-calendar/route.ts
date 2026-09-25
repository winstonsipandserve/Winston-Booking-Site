import { getActiveAdminSession } from '@/lib/admin-session'
import { getConfirmedBookingCalendar, isPhMonthKey } from '@/lib/dashboard-data'

export async function GET(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  if (!month || !isPhMonthKey(month)) {
    return Response.json({ error: 'month must be in YYYY-MM format' }, { status: 400 })
  }

  return Response.json(await getConfirmedBookingCalendar(month), { status: 200 })
}
