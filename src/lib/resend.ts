import { MEMBER_ACTIVATION_TOKEN_HOURS } from './member-activation'
import { buildBrandedEmail } from './email-templates'

const RESEND_API_BASE = 'https://api.resend.com/emails'

// Sending domain is verified in Resend (SPF/DKIM live, DMARC monitor-only)
// (see CLAUDE.md → Architecture Decisions → Transactional email sending domain).
const FROM_ADDRESS = 'no-reply@winstonsipandserve.club'
const REPLY_TO_ADDRESS = 'winstonsipandserve@gmail.com'

interface SendActivationEmailInput {
  to: string
  name: string
  activationUrl: string
}

export async function sendActivationEmail({
  to,
  name,
  activationUrl,
}: SendActivationEmailInput): Promise<void> {
  const { html, text } = buildBrandedEmail({
    preheaderText: 'Your membership application has been approved.',
    headingText: 'Your membership is approved',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Your membership application has been approved. To finish setting up your account, set your password using the link below:</p>
      <p>This link expires in ${MEMBER_ACTIVATION_TOKEN_HOURS} hours.</p>
    `,
    ctaText: 'Set Your Password',
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
        subject: 'Your Winston Sip and Serve membership is approved',
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
