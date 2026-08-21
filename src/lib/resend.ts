import { MEMBER_ACTIVATION_TOKEN_HOURS } from './member-activation'

const RESEND_API_BASE = 'https://api.resend.com/emails'

// Resend's default sandbox sender — the project has no verified sending domain yet
// (see CLAUDE.md → Open / Not Yet Decided → Domain + DNS).
const FROM_ADDRESS = 'onboarding@resend.dev'

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
        subject: 'Your Winston Sip and Serve membership is approved',
        html: `
          <p>Hi ${name},</p>
          <p>Your membership application has been approved. To finish setting up your account, set your password using the link below:</p>
          <p><a href="${activationUrl}">${activationUrl}</a></p>
          <p>This link expires in ${MEMBER_ACTIVATION_TOKEN_HOURS} hours.</p>
        `,
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
