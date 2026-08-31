import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { regenerateCheckInToken, generateQrCodeDataUrl } from '@/lib/check-in-token'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'member') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.id } })
  if (!customer) {
    return Response.json({ error: 'Customer not found' }, { status: 404 })
  }

  try {
    const token = await regenerateCheckInToken(customer.id)
    const qrCodeDataUrl = await generateQrCodeDataUrl(token)
    return Response.json({ qrCodeDataUrl }, { status: 200 })
  } catch (err) {
    console.error('Failed to regenerate check-in token', customer.id, err)
    return Response.json({ error: 'Unable to regenerate QR code' }, { status: 500 })
  }
}
