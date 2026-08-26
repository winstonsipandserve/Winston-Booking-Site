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

// Mirrors the local brand-palette constants in src/lib/resend.ts (kept local rather than
// exported from email-templates.ts, since that file's constants are private to its own
// shared layout markup).
const BRAND_DARK = '#4B2E2B'
const BRAND_MID = '#8C5A3C'
const BRAND_LIGHT = '#FDF3E7'
const ACCENT_PRIMARY = '#C08552'
const ACCENT_LIGHT = '#F5E6D3'
const BODY_FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const PREVIEW_NAME = 'Arjay'
const PREVIEW_TIER_NAME = '6-Month'
const PREVIEW_ACTIVATION_URL = 'https://winstonsipandserve.club/activate?token=preview-non-functional-token'
const PREVIEW_ACTIVATION_TOKEN_HOURS = 48

async function main() {
  const membershipPhrase = `Your ${PREVIEW_TIER_NAME} membership is confirmed, and we can't wait to see you on the court.`

  const bodyHtml = `
    <p>Hi ${PREVIEW_NAME},</p>
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
          <a href="${PREVIEW_ACTIVATION_URL}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: ${BODY_FONT}; font-size: 16px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${BRAND_LIGHT}; text-decoration: none; border-radius: 8px;">
            Activate My Account
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 20px 0 0; font-size: 14px; color: ${BRAND_MID};">Heads up — this link expires in ${PREVIEW_ACTIVATION_TOKEN_HOURS} hours.</p>
    <p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND_MID};">See you on the court,<br />— The Winston Sip &amp; Serve Team</p>
  `

  const { html, text } = buildBrandedEmail({
    preheaderText: "Your membership is approved — here's what's waiting for you.",
    eyebrowText: 'WELCOME ABOARD',
    headingText: `Welcome to the Club, ${PREVIEW_NAME}`,
    bodyHtml,
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
      subject: `[PREVIEW] Welcome to Winston Sip & Serve, ${PREVIEW_NAME}!`,
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
