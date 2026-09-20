import type { MembershipTier } from '@prisma/client'
import { MEMBER_ACTIVATION_TOKEN_HOURS } from './member-activation'
import { MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS } from './membership-payment-link'
import { ADMIN_PASSWORD_RESET_TOKEN_HOURS } from './admin-password-reset'
import { buildBrandedEmail, escapeHtml } from './email-templates'
import { formatCentavos, formatMembershipTier } from './format'
import { renderMembershipCertificatePdf } from './membership-certificate-pdf'

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
  expiryDateLabel?: string
  paymongoPaymentIntentId?: string | null
}

export async function sendActivationEmail({
  to,
  name,
  activationUrl,
  tierName,
  amountPaidCentavos,
  expiryDateLabel,
  paymongoPaymentIntentId,
}: SendActivationEmailInput): Promise<void> {
  const membershipPhrase = tierName
    ? `Your ${tierName} membership is confirmed, and we can't wait to see you on the court.`
    : `We can't wait to see you on the court.`

  const hasReceipt = amountPaidCentavos !== undefined

  const isMembershipActivation = hasReceipt && !!tierName

  const receiptHtml = hasReceipt
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Plan', escapeHtml(tierName ?? 'Membership'))}
            ${ledgerRow('Term', '12 months')}
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
  const perksHtml = isMembershipActivation
    ? ''
    : `
    <div style="margin: 24px 0; padding: 20px 24px; background-color: ${ACCENT_LIGHT}; border-radius: 12px;">
      <p style="margin: 0 0 12px; font-family: ${BODY_FONT}; font-size: 15px; font-weight: 600; color: ${BRAND_DARK};">As a member, you get:</p>
      <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};"><span style="color: ${ACCENT_PRIMARY}; font-weight: 700;">&#10003;</span>&nbsp; Advance booking priority on courts &amp; simulators</p>
      <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};"><span style="color: ${ACCENT_PRIMARY}; font-weight: 700;">&#10003;</span>&nbsp; Member discounts on every session</p>
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};"><span style="color: ${ACCENT_PRIMARY}; font-weight: 700;">&#10003;</span>&nbsp; Complimentary guest passes every year</p>
    </div>`

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Congratulations — you're officially a Winston Sip &amp; Serve member! ${membershipPhrase}</p>${perksHtml}${receiptHtml}
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

  let attachments: { filename: string; content: string }[] | undefined

  if (isMembershipActivation) {
    try {
      const pdfBuffer = await renderMembershipCertificatePdf({
        customerName: name,
        tierName: tierName!,
        amountPaidCentavos: amountPaidCentavos!,
        expiryDateLabel,
        paymongoPaymentIntentId,
      })
      attachments = [
        { filename: 'winston-membership-certificate.pdf', content: pdfBuffer.toString('base64') },
      ]
    } catch (err) {
      console.error('renderMembershipCertificatePdf failed', err)
    }
  }

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
        ...(attachments ? { attachments } : {}),
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
  expiryDateLabel: string
  /** Set for an early renewal: the Manila date the new term begins (day after the current one ends). */
  startDateLabel: string | null
}

export async function sendMembershipRenewalEmail({
  to,
  name,
  tierName,
  amountPaidCentavos,
  expiryDateLabel,
  startDateLabel,
}: SendMembershipRenewalEmailInput): Promise<void> {
  const receiptHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Plan', escapeHtml(tierName))}
            ${ledgerRow('Term', '12 months')}
            ${ledgerRow('Total Paid', formatCentavos(amountPaidCentavos), true)}
          </table>
        </td>
      </tr>
    </table>`

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your ${escapeHtml(tierName)} membership at Winston Sip &amp; Serve has been renewed — your member discounts, advance booking priority, and guest passes are all still yours.</p>${receiptHtml}
    ${
      startDateLabel
        ? `<p>Your current term keeps running as usual. The renewed term begins on <strong>${startDateLabel}</strong> and is active through <strong>${expiryDateLabel}</strong>.</p>`
        : `<p>Your membership is now active through <strong>${expiryDateLabel}</strong>.</p>`
    }
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
    <p>Hi ${escapeHtml(name)},</p>
    <p>Great news — your ${tierName} membership application has been approved! There's just one step left before your membership is active.</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: ${ACCENT_LIGHT}; border-radius: 12px;">
      <p style="margin: 0 0 4px; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Amount Due</p>
      <p style="margin: 0; font-family: ${HEADING_FONT}; font-size: 28px; font-weight: 700; color: ${BRAND_DARK};">${formatCentavos(amountCentavos)}</p>
      <p style="margin: 4px 0 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_MID};">${tierName} Membership</p>
    </div>
    <p>Complete your payment below to activate your membership and set your account password.</p>
    <p>This link will expire in ${MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS} hours.</p>
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
    <p>Hi ${escapeHtml(name)},</p>
    <p>A member of our team has prepared your membership renewal at the ${tierName} tier. Completing payment below reactivates your membership right away.</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: ${ACCENT_LIGHT}; border-radius: 12px;">
      <p style="margin: 0 0 4px; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Amount Due</p>
      <p style="margin: 0; font-family: ${HEADING_FONT}; font-size: 28px; font-weight: 700; color: ${BRAND_DARK};">${formatCentavos(amountCentavos)}</p>
      <p style="margin: 4px 0 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_MID};">${tierName} Membership Renewal</p>
    </div>
    <p>Complete your payment below to reactivate your membership.</p>
    <p>This link will expire in ${MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS} hours. If it expires, just ask us to resend it.</p>
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

interface SendActivationReminderEmailInput {
  to: string
  name: string
  activationUrl: string
}

/** Admin-triggered resend for a member who never finished first-time activation — unlike
 * sendActivationEmail, this carries no congratulations copy, receipt, or certificate, since
 * the member already joined and just needs a fresh link. */
export async function sendActivationReminderEmail({
  to,
  name,
  activationUrl,
}: SendActivationReminderEmailInput): Promise<void> {
  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>It looks like you haven't finished setting up your Winston Sip &amp; Serve account login yet. Use the button below to set your password and access your account.</p>
    <p>This link will expire in ${MEMBER_ACTIVATION_TOKEN_HOURS} hours.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: 'Finish setting up your Winston Sip & Serve account login.',
    eyebrowText: 'ACCOUNT SETUP',
    headingText: 'Set Up Your Account Login',
    bodyHtml,
    ctaText: 'Set My Password',
    ctaUrl: activationUrl,
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
        subject: 'Set Up Your Winston Sip & Serve Account Login',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendActivationReminderEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendActivationReminderEmail threw', err)
  }
}

interface SendAdminPasswordResetEmailInput {
  to: string
  resetUrl: string
}

export async function sendAdminPasswordResetEmail({
  to,
  resetUrl,
}: SendAdminPasswordResetEmailInput): Promise<void> {
  const bodyHtml = `
    <p>We received a request to reset the password for your Winston Sip &amp; Serve admin account.</p>
    <p>This link will expire in ${ADMIN_PASSWORD_RESET_TOKEN_HOURS} hour${ADMIN_PASSWORD_RESET_TOKEN_HOURS === 1 ? '' : 's'}. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: 'Reset your Winston Sip & Serve admin password.',
    eyebrowText: 'ADMIN PASSWORD RESET',
    headingText: 'Reset Your Admin Password',
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
        subject: 'Reset Your Winston Sip & Serve Admin Password',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendAdminPasswordResetEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendAdminPasswordResetEmail threw', err)
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
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};">${escapeHtml(reason)}</p>
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
  basePriceCentavos: number
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

function ledgerRow(label: string, value: string, isTotal = false, indent = false): string {
  const valueColor = isTotal ? ACCENT_PRIMARY : BRAND_DARK
  const topBorder = isTotal ? `border-top: 1px solid ${DIVIDER_COLOR}; padding-top: 12px;` : ''
  const fontSize = indent ? '13px' : '14px'
  const labelPadding = indent ? ' padding-left: 16px;' : ''
  return `
      <tr>
        <td style="padding: 6px 0; font-family: ${BODY_FONT}; font-size: ${fontSize}; color: ${BRAND_MID}; ${topBorder}${labelPadding}">${label}</td>
        <td align="right" style="padding: 6px 0; font-family: ${BODY_FONT}; font-size: ${fontSize}; font-weight: ${isTotal ? 700 : 600}; color: ${valueColor}; ${topBorder}">${value}</td>
      </tr>`
}

function ledgerSectionHeader(label: string): string {
  return `
      <tr>
        <td colspan="2" style="padding: 14px 0 4px; font-family: ${BODY_FONT}; font-size: 14px; font-weight: 700; color: ${BRAND_MID}; border-top: 1px solid ${DIVIDER_COLOR};">${label}</td>
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
  basePriceCentavos,
  addOns,
  totalPaidCentavos,
  creditRedemption,
}: SendBookingConfirmationEmailInput): Promise<void> {
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
  const durationLabel =
    durationMinutes % 60 === 0
      ? `${durationMinutes / 60} hr${durationMinutes / 60 === 1 ? '' : 's'}`
      : `${durationMinutes} min`

  const hasAddOnsBreakdown = guestCount > 0 || addOns.length > 0

  const ledgerRows = [
    ledgerRow('Sport &amp; Court', `${escapeHtml(resourceTypeName)} &mdash; ${escapeHtml(resourceLabel)}`),
    ledgerRow('Date', formatManilaDate(startTime)),
    ledgerRow('Time', `${formatManilaTime(startTime)} &ndash; ${formatManilaTime(endTime)}`),
    ledgerRow('Duration', durationLabel),
    ledgerRow('Price', formatCentavos(basePriceCentavos)),
    ...(hasAddOnsBreakdown
      ? [
          ledgerSectionHeader('Add-ons total'),
          ...(guestCount > 0
            ? [ledgerRow(`Guests — ${guestCount} Pax`, formatCentavos(guestFeeCentavos), false, true)]
            : []),
          ...addOns.map((addOn) =>
            ledgerRow(escapeHtml(addOn.name), formatCentavos(addOn.amountCentavos), false, true),
          ),
        ]
      : []),
    ledgerRow('Total Paid', formatCentavos(totalPaidCentavos), true),
  ].join('')

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
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
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_DARK};">This booking was covered by your booking credit. You have <strong>${formatCentavos(creditRedemption.remainingBalanceCentavos)}</strong> remaining.</p>
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

interface SendBookingRescheduleEmailInput {
  to: string
  name: string
  bookingReference: string
  resourceTypeName: string
  resourceLabel: string
  originalStartTime: Date
  originalEndTime: Date
  newStartTime: Date
  newEndTime: Date
  reason: string
}

export async function sendBookingRescheduleEmail({
  to,
  name,
  bookingReference,
  resourceTypeName,
  resourceLabel,
  originalStartTime,
  originalEndTime,
  newStartTime,
  newEndTime,
  reason,
}: SendBookingRescheduleEmailInput): Promise<void> {
  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your booking at Winston Sip &amp; Serve has been rescheduled. Please find your updated booking details below.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${ACCENT_LIGHT};">
          <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Booking Reference</p>
          <p style="margin: 4px 0 0; font-family: ${HEADING_FONT}; font-size: 20px; font-weight: 700; color: ${BRAND_DARK};">${escapeHtml(bookingReference)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Sport &amp; Court', `${escapeHtml(resourceTypeName)} &mdash; ${escapeHtml(resourceLabel)}`)}
            ${ledgerSectionHeader('Previous slot')}
            ${ledgerRow('Date', formatManilaDate(originalStartTime))}
            ${ledgerRow('Time', `${formatManilaTime(originalStartTime)} &ndash; ${formatManilaTime(originalEndTime)}`)}
            ${ledgerSectionHeader('New slot')}
            ${ledgerRow('Date', formatManilaDate(newStartTime))}
            ${ledgerRow('Time', `${formatManilaTime(newStartTime)} &ndash; ${formatManilaTime(newEndTime)}`)}
          </table>
        </td>
      </tr>
    </table>
    <div style="margin: 20px 0; padding: 14px 18px; background-color: rgba(140, 90, 60, 0.08); border-radius: 10px;">
      <p style="margin: 0 0 6px; font-family: ${BODY_FONT}; font-size: 14px; font-weight: 600; color: ${BRAND_DARK};">Reason for the change</p>
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_DARK}; white-space: pre-line;">${escapeHtml(reason)}</p>
    </div>
    <p>If you have any questions about this change, simply reply to this email and our team will be happy to help.</p>
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">See you soon,<br />&mdash; The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Your booking has moved to ${formatManilaDate(newStartTime)} at ${formatManilaTime(newStartTime)}.`,
    eyebrowText: 'BOOKING RESCHEDULED',
    headingText: `Your Booking Has Been Rescheduled, ${name}`,
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
        subject: `Booking Rescheduled | ${resourceLabel} | ${formatManilaDate(newStartTime)}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendBookingRescheduleEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendBookingRescheduleEmail threw', err)
  }
}

interface SendStaffBookingRescheduleNotificationEmailInput {
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  performedByName: string
  resourceTypeName: string
  resourceLabel: string
  originalStartTime: Date
  originalEndTime: Date
  newStartTime: Date
  newEndTime: Date
  reason: string
}

export async function sendStaffBookingRescheduleNotificationEmail({
  bookingReference,
  customerName,
  customerEmail,
  customerPhone,
  performedByName,
  resourceTypeName,
  resourceLabel,
  originalStartTime,
  originalEndTime,
  newStartTime,
  newEndTime,
  reason,
}: SendStaffBookingRescheduleNotificationEmailInput): Promise<void> {
  const bodyHtml = `
    <p>A booking has been rescheduled by <strong>${escapeHtml(performedByName)}</strong>.</p>
    <p style="margin: 20px 0 4px;"><strong>${escapeHtml(customerName)}</strong></p>
    <p style="margin: 0 0 2px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">${escapeHtml(customerEmail)}</a></p>
    <p style="margin: 0 0 20px;">${escapeHtml(customerPhone)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${ACCENT_LIGHT};">
          <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND_MID};">Booking Reference</p>
          <p style="margin: 4px 0 0; font-family: ${HEADING_FONT}; font-size: 20px; font-weight: 700; color: ${BRAND_DARK};">${escapeHtml(bookingReference)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Sport &amp; Court', `${escapeHtml(resourceTypeName)} &mdash; ${escapeHtml(resourceLabel)}`)}
            ${ledgerSectionHeader('Previous slot')}
            ${ledgerRow('Date', formatManilaDate(originalStartTime))}
            ${ledgerRow('Time', `${formatManilaTime(originalStartTime)} &ndash; ${formatManilaTime(originalEndTime)}`)}
            ${ledgerSectionHeader('New slot')}
            ${ledgerRow('Date', formatManilaDate(newStartTime))}
            ${ledgerRow('Time', `${formatManilaTime(newStartTime)} &ndash; ${formatManilaTime(newEndTime)}`)}
          </table>
        </td>
      </tr>
    </table>
    <div style="margin: 20px 0; padding: 14px 18px; background-color: rgba(140, 90, 60, 0.08); border-radius: 10px;">
      <p style="margin: 0 0 6px; font-family: ${BODY_FONT}; font-size: 14px; font-weight: 600; color: ${BRAND_DARK};">Reason for the change</p>
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${BRAND_DARK}; white-space: pre-line;">${escapeHtml(reason)}</p>
    </div>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `${customerName}'s booking was moved to ${formatManilaDate(newStartTime)} at ${formatManilaTime(newStartTime)}.`,
    eyebrowText: 'BOOKING RESCHEDULED',
    headingText: `Booking Rescheduled — ${resourceLabel}`,
    bodyHtml,
    ctaText: 'View in Admin',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${bookingReference}`,
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
        to: REPLY_TO_ADDRESS,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Booking | Rescheduled | ${resourceLabel} | ${formatManilaDate(newStartTime)}, ${formatManilaTime(newStartTime)} | ${bookingReference}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendStaffBookingRescheduleNotificationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendStaffBookingRescheduleNotificationEmail threw', err)
  }
}

interface SendStaffBookingNotificationEmailInput {
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  resourceTypeName: string
  resourceLabel: string
  startTime: Date
  endTime: Date
  guestCount: number
  guestFeeCentavos: number
  basePriceCentavos: number
  addOns: BookingConfirmationAddOn[]
  totalPaidCentavos: number
  creditRedemption?: { amountCentavos: number; remainingBalanceCentavos: number }
}

export async function sendStaffBookingNotificationEmail({
  bookingReference,
  customerName,
  customerEmail,
  customerPhone,
  resourceTypeName,
  resourceLabel,
  startTime,
  endTime,
  guestCount,
  guestFeeCentavos,
  basePriceCentavos,
  addOns,
  totalPaidCentavos,
  creditRedemption,
}: SendStaffBookingNotificationEmailInput): Promise<void> {
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
  const durationLabel =
    durationMinutes % 60 === 0
      ? `${durationMinutes / 60} hr${durationMinutes / 60 === 1 ? '' : 's'}`
      : `${durationMinutes} min`

  const hasAddOnsBreakdown = guestCount > 0 || addOns.length > 0

  const ledgerRows = [
    ledgerRow('Sport &amp; Court', `${escapeHtml(resourceTypeName)} &mdash; ${escapeHtml(resourceLabel)}`),
    ledgerRow('Date', formatManilaDate(startTime)),
    ledgerRow('Time', `${formatManilaTime(startTime)} &ndash; ${formatManilaTime(endTime)}`),
    ledgerRow('Duration', durationLabel),
    ledgerRow('Price', formatCentavos(basePriceCentavos)),
    ...(hasAddOnsBreakdown
      ? [
          ledgerSectionHeader('Add-ons total'),
          ...(guestCount > 0
            ? [ledgerRow(`Guests — ${guestCount} Pax`, formatCentavos(guestFeeCentavos), false, true)]
            : []),
          ...addOns.map((addOn) =>
            ledgerRow(escapeHtml(addOn.name), formatCentavos(addOn.amountCentavos), false, true),
          ),
        ]
      : []),
    ledgerRow('Total Paid', formatCentavos(totalPaidCentavos), true),
  ].join('')

  const paymentMethodLine = creditRedemption
    ? `Paid via Booking Credit &mdash; ${formatCentavos(creditRedemption.amountCentavos)} applied, ${formatCentavos(creditRedemption.remainingBalanceCentavos)} remaining`
    : 'Paid via PayMongo'

  const bodyHtml = `
    <p>A new booking has been confirmed.</p>
    <p style="margin: 20px 0 4px;"><strong>${escapeHtml(customerName)}</strong></p>
    <p style="margin: 0 0 2px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">${escapeHtml(customerEmail)}</a></p>
    <p style="margin: 0 0 20px;">${escapeHtml(customerPhone)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
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
    <p style="margin: 0; font-size: 14px; color: ${BRAND_MID};">${paymentMethodLine}</p>
  `

  const subjectDateLabel = startTime.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
  })

  const { html, text } = buildBrandedEmail({
    preheaderText: `New booking — ${resourceLabel} — ${subjectDateLabel}, ${formatManilaTime(startTime)}.`,
    eyebrowText: 'NEW BOOKING',
    headingText: `New Booking — ${resourceLabel}`,
    bodyHtml,
    ctaText: 'View in Admin',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${bookingReference}`,
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
        to: REPLY_TO_ADDRESS,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Booking | Confirmed | ${resourceLabel} | ${subjectDateLabel}, ${formatManilaTime(startTime)} | ${bookingReference}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendStaffBookingNotificationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendStaffBookingNotificationEmail threw', err)
  }
}

interface SendStaffMembershipApplicationEmailInput {
  applicationId: string
  customerName: string
  customerEmail: string
  contactNumber: string
  address: string
  requestedTier: MembershipTier
  submittedAt: Date
}

export async function sendStaffMembershipApplicationEmail({
  applicationId,
  customerName,
  customerEmail,
  contactNumber,
  address,
  requestedTier,
  submittedAt,
}: SendStaffMembershipApplicationEmailInput): Promise<void> {
  const tierName = formatMembershipTier(requestedTier)

  const bodyHtml = `
    <p>A new membership application has been submitted.</p>
    <p style="margin: 20px 0 4px;"><strong>${escapeHtml(customerName)}</strong></p>
    <p style="margin: 0 0 2px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">${escapeHtml(customerEmail)}</a></p>
    <p style="margin: 0 0 2px;">${escapeHtml(contactNumber)}</p>
    <p style="margin: 0 0 20px;">${escapeHtml(address)}</p>
    <p style="margin: 0 0 4px;"><strong>Requested Tier:</strong> ${tierName}</p>
    <p style="margin: 0;"><strong>Submitted Date:</strong> ${formatManilaDate(submittedAt)}</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `New membership application from ${customerName} — ${tierName}.`,
    eyebrowText: 'NEW APPLICATION',
    headingText: `New Membership Application — ${customerName}`,
    bodyHtml,
    ctaText: 'View in Admin',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/memberships/${applicationId}`,
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
        to: REPLY_TO_ADDRESS,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Membership | Application Submitted | ${customerName} | ${tierName}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendStaffMembershipApplicationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendStaffMembershipApplicationEmail threw', err)
  }
}

interface SendStaffMembershipActivationEmailInput {
  applicationId: string
  customerName: string
  customerEmail: string
  tierName: string
  amountPaidCentavos: number
  expiryDateLabel: string
  paymongoPaymentIntentId: string | null
}

export async function sendStaffMembershipActivationEmail({
  applicationId,
  customerName,
  customerEmail,
  tierName,
  amountPaidCentavos,
  expiryDateLabel,
  paymongoPaymentIntentId,
}: SendStaffMembershipActivationEmailInput): Promise<void> {
  const ledgerRows = [
    ledgerRow('Plan', escapeHtml(tierName)),
    ledgerRow('Total Paid', formatCentavos(amountPaidCentavos), true),
    ledgerRow('PayMongo Reference', paymongoPaymentIntentId ?? 'Not available'),
  ].join('')

  const bodyHtml = `
    <p>A membership payment has been received and a new member activated.</p>
    <p style="margin: 20px 0 4px;"><strong>${escapeHtml(customerName)}</strong></p>
    <p style="margin: 0 0 20px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">${escapeHtml(customerEmail)}</a></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRows}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: ${BRAND_MID};">Membership active through ${expiryDateLabel}.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `New member activated — ${customerName} — ${tierName}.`,
    eyebrowText: 'NEW MEMBER',
    headingText: `New Member Activated — ${customerName}`,
    bodyHtml,
    ctaText: 'View Application',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/memberships/${applicationId}`,
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
        to: REPLY_TO_ADDRESS,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Membership | Activated | ${customerName} | ${tierName}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendStaffMembershipActivationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendStaffMembershipActivationEmail threw', err)
  }
}

interface SendStaffMembershipRenewalEmailInput {
  customerName: string
  customerEmail: string
  tierName: string
  amountPaidCentavos: number
  expiryDateLabel: string
}

export async function sendStaffMembershipRenewalEmail({
  customerName,
  customerEmail,
  tierName,
  amountPaidCentavos,
  expiryDateLabel,
}: SendStaffMembershipRenewalEmailInput): Promise<void> {
  const ledgerRows = [
    ledgerRow('Plan', escapeHtml(tierName)),
    ledgerRow('Total Paid', formatCentavos(amountPaidCentavos), true),
  ].join('')

  const bodyHtml = `
    <p>A membership renewal payment has been received.</p>
    <p style="margin: 20px 0 4px;"><strong>${escapeHtml(customerName)}</strong></p>
    <p style="margin: 0 0 20px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">${escapeHtml(customerEmail)}</a></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRows}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: ${BRAND_MID};">Membership active through ${expiryDateLabel}.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Membership renewed — ${customerName} — ${tierName}.`,
    eyebrowText: 'RENEWAL',
    headingText: `Membership Renewed — ${customerName}`,
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
        to: REPLY_TO_ADDRESS,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Membership | Renewed | ${customerName} | ${tierName}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendStaffMembershipRenewalEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendStaffMembershipRenewalEmail threw', err)
  }
}

interface SendStaffTopUpAfterExpiryEmailInput {
  customerName: string
  customerEmail: string
  amountCentavos: number
  newBalanceCentavos: number
  expiryDateLabel: string
  paymentId: string
}

/**
 * A top-up checkout that was started while the membership was active but paid after the
 * term ended. The credit has already been applied; staff decide on a refund or a renewal.
 */
export async function sendStaffTopUpAfterExpiryEmail({
  customerName,
  customerEmail,
  amountCentavos,
  newBalanceCentavos,
  expiryDateLabel,
  paymentId,
}: SendStaffTopUpAfterExpiryEmailInput): Promise<void> {
  const ledgerRows = [
    ledgerRow('Top-Up Paid', formatCentavos(amountCentavos)),
    ledgerRow('Balance After Credit', formatCentavos(newBalanceCentavos)),
    ledgerRow('Membership Ended', expiryDateLabel),
    ledgerRow('Payment ID', escapeHtml(paymentId), true),
  ].join('')

  const bodyHtml = `
    <p>A credit top-up was paid <strong>after</strong> the member's term had already ended. The credit has been applied to the expired membership so no payment is lost, but it cannot be spent until the member renews.</p>
    <p style="margin: 20px 0 4px;"><strong>${escapeHtml(customerName)}</strong></p>
    <p style="margin: 0 0 20px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: ${ACCENT_PRIMARY}; text-decoration: underline;">${escapeHtml(customerEmail)}</a></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRows}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; color: ${BRAND_MID};">Please contact the member to arrange a refund through PayMongo or a renewal.</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Top-up paid after expiry — ${customerName}.`,
    eyebrowText: 'ACTION NEEDED',
    headingText: `Top-Up After Expiry — ${customerName}`,
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
        to: REPLY_TO_ADDRESS,
        reply_to: REPLY_TO_ADDRESS,
        subject: `Membership | Top-Up After Expiry | ${customerName} | ${formatCentavos(amountCentavos)}`,
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendStaffTopUpAfterExpiryEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendStaffTopUpAfterExpiryEmail threw', err)
  }
}

interface SendCreditTopUpConfirmationEmailInput {
  to: string
  name: string
  amountCentavos: number
  newBalanceCentavos: number
}

export async function sendCreditTopUpConfirmationEmail({
  to,
  name,
  amountCentavos,
  newBalanceCentavos,
}: SendCreditTopUpConfirmationEmailInput): Promise<void> {
  const receiptHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${ledgerRow('Amount Added', formatCentavos(amountCentavos))}
            ${ledgerRow('New Credit Balance', formatCentavos(newBalanceCentavos), true)}
          </table>
        </td>
      </tr>
    </table>`

  const bodyHtml = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your Winston Sip &amp; Serve F&amp;B credit has been topped up.</p>${receiptHtml}
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">See you on the court,<br />— The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `${formatCentavos(amountCentavos)} added to your F&B credit balance.`,
    eyebrowText: 'CREDIT TOP-UP',
    headingText: `Credit Added, ${name}!`,
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
        subject: 'Your Winston Sip & Serve Credit Top-Up Is Confirmed',
        html,
        text,
      }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Resend sendCreditTopUpConfirmationEmail failed', res.status, errorBody)
    }
  } catch (err) {
    console.error('Resend sendCreditTopUpConfirmationEmail threw', err)
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

/** "today" / "tomorrow" / "in N days" for a Manila calendar-day count. */
function describeDaysRemaining(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'today'
  if (daysRemaining === 1) return 'tomorrow'
  return `in ${daysRemaining} days`
}

export async function sendMembershipExpiryReminderEmail(
  customer: ReminderCustomer,
  membership: ReminderMembership,
  /** Whole Manila calendar days until endDate at send time — not the cron window that selected the row. */
  daysRemaining: number,
): Promise<void> {
  const tierName = formatMembershipTier(membership.tier)
  const endDateLabel = formatManilaDate(membership.endDate)
  const urgent = daysRemaining <= 3
  const expiresIn = describeDaysRemaining(daysRemaining)
  const headingText = urgent
    ? daysRemaining <= 0
      ? `Expires Today, ${customer.name}`
      : daysRemaining === 1
        ? `1 Day Left, ${customer.name}`
        : `${daysRemaining} Days Left, ${customer.name}`
    : 'Your Membership Is Expiring Soon'

  const creditLine =
    membership.creditBalanceCentavos > 0
      ? `<p style="margin: 16px 0 0; font-size: 14px; color: ${BRAND_MID};">You still have ${formatCentavos(membership.creditBalanceCentavos)} in unused F&amp;B credit &mdash; it does not roll over and will be forfeited once your membership expires.</p>`
      : ''

  const bodyHtml = urgent
    ? `
    <p>Hi ${escapeHtml(customer.name)},</p>
    <p>Your ${tierName} membership expires ${expiresIn}, on <strong>${endDateLabel}</strong>. Renew now to keep your member rates and perks going without a gap &mdash; the renewed term starts right after this one ends.</p>${creditLine}
  `
    : `
    <p>Hi ${escapeHtml(customer.name)},</p>
    <p>Just a heads-up &mdash; your ${tierName} membership is set to expire on <strong>${endDateLabel}</strong>, ${expiresIn}. Renew any time before then to keep your priority booking, member rates, and Speakeasy Lounge access going &mdash; the renewed term starts right after this one ends.</p>${creditLine}
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: urgent
      ? `Your membership expires ${expiresIn} &mdash; renew now.`
      : `Your membership expires ${expiresIn}.`,
    eyebrowText: urgent ? 'EXPIRES SOON' : 'MEMBERSHIP REMINDER',
    headingText,
    bodyHtml,
    ctaText: 'Renew Your Membership',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/renew`,
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
          ? `Your Winston Membership Expires ${daysRemaining <= 0 ? 'Today' : daysRemaining === 1 ? 'Tomorrow' : `in ${daysRemaining} Days`}`
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
    <p>Hi ${escapeHtml(customer.name)},</p>
    <p>Your ${tierName} membership expired on ${endDateLabel}.${creditNote}</p>
    <div style="margin: 24px 0; padding: 20px 24px; background-color: rgba(140, 90, 60, 0.08); border-left: 4px solid ${ACCENT_PRIMARY}; border-radius: 8px;">
      <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_DARK};">You're still always welcome at Winston as a guest &mdash; book a court, simulator bay, or table at the café any time. Log in and renew below whenever you're ready to pick your member rates and perks back up.</p>
    </div>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: `Your ${tierName} membership has expired.`,
    eyebrowText: 'MEMBERSHIP EXPIRED',
    headingText: 'Your Membership Has Expired',
    bodyHtml,
    ctaText: 'Renew Your Membership',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/renew`,
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
