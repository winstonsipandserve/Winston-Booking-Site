// Local-only preview script — NOT committed (see CLAUDE.md dev workflow / manual git policy).
// Sends one raw email through buildBrandedEmail so the branded layout can be eyeballed in an
// actual inbox without touching the DB or the real sendActivationEmail call site.
//
// Run: npx dotenv -e .env.local -- tsx scripts/preview-approval-email.ts

import { buildBrandedEmail } from '../src/lib/email-templates'

const RESEND_API_BASE = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'no-reply@winstonsipandserve.club'
const REPLY_TO_ADDRESS = 'winstonsipandserve@gmail.com'
const PREVIEW_RECIPIENT = 'arjayrafaelical@gmail.com'

async function main() {
  const { html, text } = buildBrandedEmail({
    preheaderText: 'Your membership application has been approved.',
    eyebrowText: 'Membership Approved',
    headingText: 'Your membership is approved',
    bodyHtml: `
      <p>Hi Arjay,</p>
      <p>Your membership application has been approved. To finish setting up your account, set your password using the link below:</p>
      <p>This link expires in 48 hours.</p>
    `,
    ctaText: 'Set Your Password',
    ctaUrl: 'https://winstonsipandserve.club/activate?token=preview-non-functional-token',
  })

  const res = await fetch(RESEND_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: PREVIEW_RECIPIENT,
      reply_to: REPLY_TO_ADDRESS,
      subject: '[PREVIEW] Your Winston Sip and Serve membership is approved',
      html,
      text,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('Preview send failed', res.status, errorBody)
    process.exit(1)
  }

  const body = await res.json()
  console.log('Preview send succeeded', body)
}

main()
