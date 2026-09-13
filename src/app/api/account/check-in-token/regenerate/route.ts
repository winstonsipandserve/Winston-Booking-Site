import { getActiveMemberSession } from '@/lib/member-session'
import { regenerateCheckInToken, generateQrCodeDataUrl } from '@/lib/check-in-token'

export async function POST() {
  const memberSession = await getActiveMemberSession()
  if (!memberSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { customer } = memberSession

  try {
    const { token, code } = await regenerateCheckInToken(customer.id)
    const qrCodeDataUrl = await generateQrCodeDataUrl(token)
    return Response.json({ qrCodeDataUrl, checkInCode: code }, { status: 200 })
  } catch (err) {
    console.error('Failed to regenerate check-in token', customer.id, err)
    return Response.json({ error: 'Unable to regenerate QR code' }, { status: 500 })
  }
}
