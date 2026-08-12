import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      resource: { include: { resourceType: true } },
      customer: true,
      addOns: { include: { addOnService: true, addOnPricingRule: true } },
      payment: true,
    },
  })

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 })
  }

  const addOnsTotalCentavos = booking.addOns.reduce((sum, a) => sum + a.amountCentavos, 0)

  return Response.json(
    {
      id: booking.id,
      status: booking.status,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmountCentavos: booking.totalAmountCentavos,
      addOns: booking.addOns.map((addOn) => ({
        service: addOn.addOnService.slug,
        paxCount: addOn.addOnPricingRule.paxCount,
        amountCentavos: addOn.amountCentavos,
      })),
      addOnsTotalCentavos,
      resource: {
        typeName: booking.resource.resourceType.name,
        label: booking.resource.label,
      },
      guestCount: booking.guestCount,
      customer: { name: booking.customer.name },
      payment: booking.payment
        ? {
            status: booking.payment.status,
            amountCentavos: booking.payment.amountCentavos,
            paidAt: booking.payment.paidAt,
          }
        : null,
    },
    { status: 200 },
  )
}
