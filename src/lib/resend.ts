import type { MembershipTier } from '@prisma/client'
import { MEMBER_ACTIVATION_TOKEN_HOURS } from './member-activation'
import { buildBrandedEmail } from './email-templates'
import { formatCentavos, formatMembershipTier } from './format'

const RESEND_API_BASE = 'https://api.resend.com/emails'

// Sending domain is verified in Resend (SPF/DKIM live, DMARC monitor-only)
// (see CLAUDE.md → Architecture Decisions → Transactional email sending domain).
const FROM_ADDRESS = 'no-reply@winstonsipandserve.club'
const REPLY_TO_ADDRESS = 'winstonsipandserve@gmail.com'

// Mirrors the brand palette in email-templates.ts (kept local rather than exported from
// there, since that file's constants are private to its own shared layout markup).
const BRAND_DARK = '#4B2E2B'
const BRAND_MID = '#8C5A3C'
const BRAND_LIGHT = '#FDF3E7'
const ACCENT_PRIMARY = '#C08552'
const ACCENT_LIGHT = '#F5E6D3'
const BODY_FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const HEADING_FONT = "Georgia, 'Times New Roman', serif"
const DIVIDER_COLOR = 'rgba(140, 90, 60, 0.25)'

interface SendActivationEmailInput {
  to: string
  name: string
  activationUrl: string
  tierName?: string
  amountPaidCentavos?: number
  activationFeeCentavos?: number
  creditBalanceCentavos?: number
}

export async function sendActivationEmail({
  to,
  name,
  activationUrl,
  tierName,
  amountPaidCentavos,
  activationFeeCentavos,
  creditBalanceCentavos,
}: SendActivationEmailInput): Promise<void> {
  const membershipPhrase = tierName
    ? `Your ${tierName} membership is confirmed, and we can't wait to see you on the court.`
    : `We can't wait to see you on the court.`

  const hasReceipt =
    amountPaidCentavos !== undefined &&
    activationFeeCentavos !== undefined &&
    creditBalanceCentavos !== undefined

  const receiptHtml = hasReceipt
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Activation Fee', formatCentavos(activationFeeCentavos))}
            ${ledgerRow('F&amp;B Credit', formatCentavos(creditBalanceCentavos))}
            ${ledgerRow('Total Paid', formatCentavos(amountPaidCentavos), true)}
          </table>
        </td>
      </tr>
    </table>`
    : ''

  // The CTA button is built inline (matching buildBrandedEmail's own ctaHtml markup,
  // including the Outlook border-radius caveat) instead of via buildBrandedEmail's ctaText/
  // ctaUrl params, because the expiry notice below needs to render after the button —
  // buildBrandedEmail always renders bodyHtml before its own CTA, with nothing after it.
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Congratulations — you're officially a Winston Sip &amp; Serve member! ${membershipPhrase}</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: ${ACCENT_LIGHT}; border-radius: 12px;">
      <p style="margin: 0 0 12px; font-family: ${BODY_FONT}; font-size: 15px; font-weight: 600; color: ${BRAND_DARK};">As a member, you get:</p>
      <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};"><span style="color: ${ACCENT_PRIMARY}; font-weight: 700;">&#10003;</span>&nbsp; Priority booking on courts &amp; simulators</p>
      <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};"><span style="color: ${ACCENT_PRIMARY}; font-weight: 700;">&#10003;</span>&nbsp; Member rates on every session</p>
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};"><span style="color: ${ACCENT_PRIMARY}; font-weight: 700;">&#10003;</span>&nbsp; Access to the Speakeasy Lounge</p>
    </div>${receiptHtml}
    <p>Set your password below to activate your account and lock in these perks.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px auto 0;">
      <tr>
        <td align="center" bgcolor="${ACCENT_PRIMARY}" style="border-radius: 8px;">
          <a href="${activationUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: ${BODY_FONT}; font-size: 16px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${BRAND_LIGHT}; text-decoration: none; border-radius: 8px;">
            Activate My Account
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 20px 0 0; font-size: 14px; color: ${BRAND_MID};">Heads up — this link expires in ${MEMBER_ACTIVATION_TOKEN_HOURS} hours.</p>
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">See you on the court,<br />— The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: "Your membership is approved — here's what's waiting for you.",
    eyebrowText: 'WELCOME ABOARD',
    headingText: `Welcome to the Club, ${name}`,
    bodyHtml,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Welcome to Winston Sip & Serve, ${name}!`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendActivationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendActivationEmail threw', err)
  }
}

interface SendMembershipRenewalEmailInput {
  to: string
  name: string
  tierName: string
  amountPaidCentavos: number
  activationFeeCentavos: number
  creditBalanceCentavos: number
  expiryDateLabel: string
}

export async function sendMembershipRenewalEmail({
  to,
  name,
  tierName,
  amountPaidCentavos,
  activationFeeCentavos,
  creditBalanceCentavos,
  expiryDateLabel,
}: SendMembershipRenewalEmailInput): Promise<void> {
  const receiptHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Activation Fee', formatCentavos(activationFeeCentavos))}
            ${ledgerRow('F&amp;B Credit', formatCentavos(creditBalanceCentavos))}
            ${ledgerRow('Total Paid', formatCentavos(amountPaidCentavos), true)}
          </table>
        </td>
      </tr>
    </table>`

  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Your ${tierName} membership at Winston Sip &amp; Serve has been renewed — your member rates, priority booking, and Speakeasy Lounge access are all still yours.</p>${receiptHtml}
    <p>Your membership is now active through <strong>${expiryDateLabel}</strong>.</p>
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">See you on the court,<br />— The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Your membership is renewed through ${expiryDateLabel}.`,
    eyebrowText: 'WELCOME BACK',
    headingText: `You're Renewed, ${name}!`,
    bodyHtml,
    ctaText: 'View My Account',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: 'Welcome Back — Your Winston Sip & Serve Membership Has Been Renewed',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendMembershipRenewalEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendMembershipRenewalEmail threw', err)
  }
}

interface SendMembershipPaymentEmailInput {
  to: string
  name: string
  tierName: string
  amountCentavos: number
  paymentUrl: string
}

export async function sendMembershipPaymentEmail({
  to,
  name,
  tierName,
  amountCentavos,
  paymentUrl,
}: SendMembershipPaymentEmailInput): Promise<void> {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Great news — your ${tierName} membership application has been approved! There's just one step left before your membership is active.</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: ${ACCENT_LIGHT}; border-radius: 12px;">
      <p style="margin: 0 0 4px; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Amount Due</p>
      <p style="margin: 0; font-family: ${HEADING_FONT}; font-size: 28px; font-weight: 700; color: ${BRAND_DARK};">${formatCentavos(amountCentavos)}</p>
      <p style="margin: 4px 0 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_MID};">${tierName} Membership</p>
    </div>
    <p>Complete your payment below to activate your membership and set your account password.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Complete your payment to activate your ${tierName} membership.`,
    eyebrowText: "YOU'RE APPROVED",
    headingText: `One Step Left, ${name}`,
    bodyHtml,
    ctaText: 'Complete Payment',
    ctaUrl: paymentUrl,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: "You're Approved — Complete Your Winston Sip & Serve Membership Payment",
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendMembershipPaymentEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendMembershipPaymentEmail threw', err)
  }
}

interface SendRenewalPaymentLinkEmailInput {
  to: string
  name: string
  tierName: string
  amountCentavos: number
  paymentUrl: string
}

export async function sendRenewalPaymentLinkEmail({
  to,
  name,
  tierName,
  amountCentavos,
  paymentUrl,
}: SendRenewalPaymentLinkEmailInput): Promise<void> {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>A member of our team has prepared your membership renewal at the ${tierName} tier. Completing payment below reactivates your membership right away.</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: ${ACCENT_LIGHT}; border-radius: 12px;">
      <p style="margin: 0 0 4px; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Amount Due</p>
      <p style="margin: 0; font-family: ${HEADING_FONT}; font-size: 28px; font-weight: 700; color: ${BRAND_DARK};">${formatCentavos(amountCentavos)}</p>
      <p style="margin: 4px 0 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_MID};">${tierName} Membership Renewal</p>
    </div>
    <p>Complete your payment below to reactivate your membership.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Complete your payment to renew your ${tierName} membership.`,
    eyebrowText: 'TIME TO RENEW',
    headingText: `Ready to Renew, ${name}?`,
    bodyHtml,
    ctaText: 'Complete Payment',
    ctaUrl: paymentUrl,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: 'Renew Your Winston Sip & Serve Membership',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendRenewalPaymentLinkEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendRenewalPaymentLinkEmail threw', err)
  }
}

interface SendPasswordResetEmailInput {
  to: string
  resetUrl: string
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailInput): Promise<void> {
  const bodyHtml = `
    <p>We received a request to reset the password for your Winston Sip &amp; Serve account.</p>
    <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: 'Reset your Winston Sip & Serve password.',
    eyebrowText: 'PASSWORD RESET',
    headingText: 'Reset Your Password',
    bodyHtml,
    ctaText: 'Reset My Password',
    ctaUrl: resetUrl,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: 'Reset Your Winston Sip & Serve Password',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendPasswordResetEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendPasswordResetEmail threw', err)
  }
}

interface SendRejectionEmailInput {
  to: string
  name: string
  reason: string
}

export async function sendRejectionEmail({
  to,
  name,
  reason,
}: SendRejectionEmailInput): Promise<void> {
  const bodyHtml = `
    <p>Thank you for taking the time to apply for membership at Winston Sip &amp; Serve. We've completed our review of your application.</p>
    <p>After careful review, we're unable to offer you membership at this time.</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: rgba(140, 90, 60, 0.08); border-left: 4px solid ${ACCENT_PRIMARY}; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 15px; font-weight: 600; color: ${BRAND_DARK};">Here's a bit more context from our team:</p>
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};">${reason}</p>
    </div>
    <p>You're always welcome at Winston as our guest — feel free to <a href="${process.env.NEXT_PUBLIC_APP_URL}/book" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">book a court</a>, simulator bay, or table at the café any time. And if your circumstances change, we'd be glad to have you apply again in the future.</p>
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">Warmly,<br />The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: "Thank you for applying — here's where things stand.",
    eyebrowText: 'APPLICATION UPDATE',
    headingText: `Thank You for Your Interest, ${name}`,
    bodyHtml,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: 'An Update on Your Winston Sip & Serve Membership Application',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendRejectionEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendRejectionEmail threw', err)
  }
}

interface BookingConfirmationAddOn {
  name: string
  amountCentavos: number
}

interface SendBookingConfirmationEmailInput {
  to: string
  name: string
  bookingReference: string
  resourceTypeName: string
  resourceLabel: string
  startTime: Date
  endTime: Date
  guestCount: number
  guestFeeCentavos: number
  addOns: BookingConfirmationAddOn[]
  totalPaidCentavos: number
  creditRedemption?: { amountCentavos: number; remainingBalanceCentavos: number }
}

function formatManilaDate(date: Date): string {
  return date.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatManilaTime(date: Date): string {
  return date.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function ledgerRow(label: string, value: string, isTotal = false): string {
  const valueColor = isTotal ? ACCENT_PRIMARY : BRAND_DARK
  const topBorder = isTotal ? `border-top: 1px solid ${DIVIDER_COLOR}; padding-top: 12px;` : ''
  return `
      <tr>
        <td style="padding: 6px 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_MID}; ${topBorder}">${label}</td>
        <td align="right" style="padding: 6px 0; font-family: ${BODY_FONT}; font-size: 14px; font-weight: ${isTotal ? 700 : 600}; color: ${valueColor}; ${topBorder}">${value}</td>
      </tr>`
}

export async function sendBookingConfirmationEmail({
  to,
  name,
  bookingReference,
  resourceTypeName,
  resourceLabel,
  startTime,
  endTime,
  guestCount,
  guestFeeCentavos,
  addOns,
  totalPaidCentavos,
  creditRedemption,
}: SendBookingConfirmationEmailInput): Promise<void> {
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
  const durationLabel =
    durationMinutes % 60 === 0
      ? `${durationMinutes / 60} hr${durationMinutes / 60 === 1 ? '' : 's'}`
      : `${durationMinutes} min`

  const ledgerRows = [
    ledgerRow('Sport &amp; Court', `${resourceTypeName} &mdash; ${resourceLabel}`),
    ledgerRow('Date', formatManilaDate(startTime)),
    ledgerRow('Time', `${formatManilaTime(startTime)} &ndash; ${formatManilaTime(endTime)}`),
    ledgerRow('Duration', durationLabel),
    ...(guestCount > 0
      ? [ledgerRow(`Guest Fee (+${guestCount})`, formatCentavos(guestFeeCentavos))]
      : []),
    ...addOns.map((addOn) => ledgerRow(addOn.name, formatCentavos(addOn.amountCentavos))),
    ledgerRow('Total Paid', formatCentavos(totalPaidCentavos), true),
  ].join('')

  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Your spot at Winston Sip &amp; Serve is locked in. Here's everything you need before you arrive.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${ACCENT_LIGHT};">
          <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Booking Reference</p>
          <p style="margin: 4px 0 0; font-family: ${HEADING_FONT}; font-size: 20px; font-weight: 700; color: ${BRAND_DARK};">${bookingReference}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRows}
          </table>
        </td>
      </tr>
    </table>
    ${creditRedemption ? `
    <div style="margin: 20px 0 0; padding: 14px 18px; background-color: rgba(140, 90, 60, 0.08); border-radius: 10px;">
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_DARK};">This booking was covered by your F&amp;B credit. You have <strong>${formatCentavos(creditRedemption.remainingBalanceCentavos)}</strong> remaining.</p>
    </div>` : ''}
    <div style="margin: 24px 0; padding: 18px 20px; background-color: rgba(140, 90, 60, 0.08); border-radius: 10px;">
      <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 14px; font-weight: 600; color: ${BRAND_DARK};">Before You Arrive</p>
      <p style="margin: 0 0 6px; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_DARK};">We're open 6:00 AM &ndash; 10:00 PM daily &mdash; try to arrive a few minutes early so your session starts right on time.</p>
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_DARK};">Bookings are confirmed and final. If anything comes up, just reply to this email and we'll help however we can.</p>
    </div>
    <p>While you're here &mdash; swing by the <a href="${process.env.NEXT_PUBLIC_APP_URL}/cafe-bar" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">Café &amp; Bar</a> for a coffee before your session or a cocktail after.</p>
    <p style="margin: 20px 0 0;">And if you're booking often, membership pays for itself &mdash; member rates on every session, priority booking, and access to the Speakeasy Lounge.</p>
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">See you soon,<br />&mdash; The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Your booking is confirmed for ${formatManilaDate(startTime)}.`,
    eyebrowText: 'BOOKING CONFIRMED',
    headingText: `You're All Set, ${name}!`,
    bodyHtml,
    ctaText: 'Explore Membership Perks',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/membership`,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        reply_to: REPLY_TO_ADDRESS,
        subject: `You're All Set, ${name} — Your Winston Booking is Confirmed`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendBookingConfirmationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendBookingConfirmationEmail threw', err)
  }
}

interface ReminderCustomer {
  name: string
  email: string
}

interface ReminderMembership {
  tier: MembershipTier
  endDate: Date
  creditBalanceCentavos: number
}

export async function sendMembershipExpiryReminderEmail(
  customer: ReminderCustomer,
  membership: ReminderMembership,
  daysRemaining: 14 | 3,
): Promise<void> {
  const tierName = formatMembershipTier(membership.tier)
  const endDateLabel = formatManilaDate(membership.endDate)
  const urgent = daysRemaining === 3

  const creditLine =
    membership.creditBalanceCentavos > 0
      ? `<p style="margin: 16px 0 0; font-size: 14px; color: ${BRAND_MID};">You still have ${formatCentavos(membership.creditBalanceCentavos)} in unused F&amp;B credit &mdash; it does not roll over and will be forfeited once your membership expires.</p>`
      : ''

  const bodyHtml = urgent
    ? `
    <p>Hi ${customer.name},</p>
    <p>Your ${tierName} membership expires in just ${daysRemaining} days, on <strong>${endDateLabel}</strong>. Renew now to keep your member rates and perks going without a gap.</p>${creditLine}
  `
    : `
    <p>Hi ${customer.name},</p>
    <p>Just a heads-up &mdash; your ${tierName} membership is set to expire on <strong>${endDateLabel}</strong>, ${daysRemaining} days from now. Renew any time before then to keep your priority booking, member rates, and Speakeasy Lounge access going.</p>${creditLine}
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: urgent
      ? `Your membership expires in ${daysRemaining} days &mdash; renew now.`
      : `Your membership expires in ${daysRemaining} days.`,
    eyebrowText: urgent ? 'EXPIRES SOON' : 'MEMBERSHIP REMINDER',
    headingText: urgent ? `${daysRemaining} Days Left, ${customer.name}` : 'Your Membership Is Expiring Soon',
    bodyHtml,
    ctaText: 'Renew Your Membership',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/membership/apply`,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: customer.email,
        reply_to: REPLY_TO_ADDRESS,
        subject: urgent
          ? `Your Winston Membership Expires in ${daysRemaining} Days`
          : 'Your Winston Membership Expires Soon',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendMembershipExpiryReminderEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendMembershipExpiryReminderEmail threw', err)
  }
}

export async function sendMembershipExpiredEmail(
  customer: ReminderCustomer,
  membership: ReminderMembership,
): Promise<void> {
  const tierName = formatMembershipTier(membership.tier)
  const endDateLabel = formatManilaDate(membership.endDate)

  const creditNote =
    membership.creditBalanceCentavos > 0
      ? ` Any unused F&amp;B credit (${formatCentavos(membership.creditBalanceCentavos)}) does not roll over and has now been forfeited.`
      : ''

  const bodyHtml = `
    <p>Hi ${customer.name},</p>
    <p>Your ${tierName} membership expired on ${endDateLabel}.${creditNote}</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: rgba(140, 90, 60, 0.08); border-left: 4px solid ${ACCENT_PRIMARY}; border-radius: 8px;">
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};">You're still always welcome at Winston as a guest &mdash; book a court, simulator bay, or table at the café any time. Reapply below whenever you're ready to pick your member rates and perks back up.</p>
    </div>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Your ${tierName} membership has expired.`,
    eyebrowText: 'MEMBERSHIP EXPIRED',
    headingText: 'Your Membership Has Expired',
    bodyHtml,
    ctaText: 'Reapply for Membership',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/membership/apply`,
  })

  try {
    const res = await fetch(RESEND_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: customer.email,
        reply_to: REPLY_TO_ADDRESS,
        subject: 'Your Winston Sip & Serve Membership Has Expired',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendMembershipExpiredEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendMembershipExpiredEmail threw', err)
  }
}
