import { prisma } from '@/lib/prisma'
import { sendBookingConfirmationEmail, sendStaffBookingNotificationEmail } from '@/lib/resend'

export const ADD_ON_EMAIL_LABELS: Record<string, string> = {
  ball_boy: 'Ball Boy',
  coaching_fee: 'Coaching',
}

export interface CreditRedemptionInfo {
  amountCentavos: number
  remainingBalanceCentavos: number
}

export async function sendBookingConfirmationEmailForBooking(
  bookingId: string,
  creditRedemption?: CreditRedemptionInfo,
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      resource: { include: { resourceType: true } },
      addOns: { include: { addOnService: true, addOnPricingRule: true } },
    },
    relationLoadStrategy: 'query',
  })

  if (!booking) {
    console.error('sendBookingConfirmationEmailForBooking: booking not found', bookingId)
    return
  }
  if (!booking.customer) {
    console.error(
      'sendBookingConfirmationEmailForBooking: booking has no customer attached',
      bookingId,
    )
    return
  }

  const addOnsTotalCentavos = booking.addOns.reduce((sum, a) => sum + a.amountCentavos, 0)
  const totalPaidCentavos = booking.totalAmountCentavos + addOnsTotalCentavos

  let guestFeeCentavos = 0
  if (booking.guestCount > 0) {
    const guestFeeRule = await prisma.guestFeeRule.findFirst()
    if (!guestFeeRule) {
      console.error(
        'GuestFeeRule table is empty — cannot compute guest fee for confirmation email',
        booking.id,
      )
    } else {
      guestFeeCentavos = booking.guestCount * guestFeeRule.amountCentavos
    }
  }

  const addOns = booking.addOns.map((addOn) => {
    const label = ADD_ON_EMAIL_LABELS[addOn.addOnService.slug] ?? addOn.addOnService.slug
    const paxSuffix =
      addOn.addOnPricingRule.paxCount !== null ? ` (${addOn.addOnPricingRule.paxCount} pax)` : ''
    return { name: `${label}${paxSuffix}`, amountCentavos: addOn.amountCentavos }
  })

  await sendBookingConfirmationEmail({
    to: booking.customer.email,
    name: booking.customer.name,
    bookingReference: booking.id,
    resourceTypeName: booking.resource.resourceType.name,
    resourceLabel: booking.resource.label,
    startTime: booking.startTime,
    endTime: booking.endTime,
    guestCount: booking.guestCount,
    guestFeeCentavos,
    addOns,
    totalPaidCentavos,
    creditRedemption,
  })

  await sendStaffBookingNotificationEmail({
    bookingReference: booking.id,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    customerPhone: booking.customer.phone,
    resourceTypeName: booking.resource.resourceType.name,
    resourceLabel: booking.resource.label,
    startTime: booking.startTime,
    endTime: booking.endTime,
    guestCount: booking.guestCount,
    guestFeeCentavos,
    addOns,
    totalPaidCentavos,
    creditRedemption,
  })
}
