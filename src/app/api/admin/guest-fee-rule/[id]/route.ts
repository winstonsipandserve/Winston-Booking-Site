import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

interface UpdateGuestFeeRuleBody {
  amountCentavos?: unknown
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.guestFeeRule.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Guest fee rule not found' }, { status: 404 })
  }

  let body: UpdateGuestFeeRuleBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { amountCentavos } = body
  if (!(typeof amountCentavos === 'number' && Number.isInteger(amountCentavos) && amountCentavos > 0)) {
    return Response.json({ error: 'amountCentavos must be a positive integer' }, { status: 400 })
  }

  const guestFeeRule = await prisma.guestFeeRule.update({
    where: { id },
    data: { amountCentavos },
  })

  return Response.json(guestFeeRule, { status: 200 })
}
