import { MEMBER_ACTIVATION_TOKEN_HOURS } from './member-activation'
import { buildBrandedEmail } from './email-templates'

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

interface SendActivationEmailInput {
  to: string
  name: string
  activationUrl: string
  tierName?: string
}

export async function sendActivationEmail({
  to,
  name,
  activationUrl,
  tierName,
}: SendActivationEmailInput): Promise<void> {
  const membershipPhrase = tierName
    ? `Your ${tierName} membership is confirmed, and we can't wait to see you on the court.`
    : `We can't wait to see you on the court.`

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
    </div>
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
