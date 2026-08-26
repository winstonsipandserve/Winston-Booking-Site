// Shared branded layout for all transactional emails (activation today; rejection-notice
// and forgot-password emails will reuse this same function in future prompts). Table-based
// HTML with all styles inline, since most email clients strip <style> blocks and ignore
// external stylesheets. Brand palette only — see CLAUDE.md's design tokens
// (src/app/globals.css): brand-dark, brand-mid, brand-light, accent-primary, accent-light.

const BRAND_DARK = '#4B2E2B'
const BRAND_MID = '#8C5A3C'
const BRAND_LIGHT = '#FDF3E7'
const ACCENT_PRIMARY = '#C08552'
const ACCENT_LIGHT = '#F5E6D3'
// Light tint of BRAND_MID (#8C5A3C -> rgb(140, 90, 60)) for the body/footer divider.
const DIVIDER_COLOR = 'rgba(140, 90, 60, 0.25)'

const HEADING_FONT = "Georgia, 'Times New Roman', serif"
const BODY_FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const EMAIL_LOGO_URL =
  'https://vsmjybtidvmzvicdpkdo.supabase.co/storage/v1/object/public/email-assets/winston-logo-emblem-transparent.png'

const REPLY_TO_ADDRESS = 'winstonsipandserve@gmail.com'

interface BuildBrandedEmailInput {
  preheaderText: string
  eyebrowText?: string
  headingText: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
}

interface BuildBrandedEmailOutput {
  html: string
  text: string
}

export function buildBrandedEmail({
  preheaderText,
  eyebrowText,
  headingText,
  bodyHtml,
  ctaText,
  ctaUrl,
}: BuildBrandedEmailInput): BuildBrandedEmailOutput {
  const showCta = Boolean(ctaText && ctaUrl)
  const showEyebrow = Boolean(eyebrowText)

  const eyebrowHtml = showEyebrow
    ? `
                    <p style="margin: 0 0 8px; font-family: ${BODY_FONT}; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${ACCENT_PRIMARY};">
                      ${eyebrowText}
                    </p>`
    : ''

  // 8px border-radius on the CTA is a known email-client limitation: Outlook desktop
  // (Word rendering engine) ignores border-radius and renders square corners regardless.
  const ctaHtml = showCta
    ? `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px auto 0;">
                    <tr>
                      <td align="center" bgcolor="${ACCENT_PRIMARY}" style="border-radius: 8px;">
                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: ${BODY_FONT}; font-size: 16px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${BRAND_LIGHT}; text-decoration: none; border-radius: 8px;">
                          ${ctaText}
                        </a>
                      </td>
                    </tr>
                  </table>`
    : ''

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${headingText}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${BRAND_LIGHT}; font-family: ${BODY_FONT};">
        <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
          ${preheaderText}
          &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND_LIGHT};">
          <tr>
            <td align="center" style="padding: 32px 16px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border: 1px solid ${ACCENT_LIGHT}; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td bgcolor="${ACCENT_PRIMARY}" style="height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" bgcolor="${BRAND_DARK}" style="padding: 28px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td width="88" height="88" align="center" valign="middle" bgcolor="${BRAND_LIGHT}" style="width: 88px; height: 88px; border-radius: 50%;">
                          <img src="${EMAIL_LOGO_URL}" alt="Winston Sip & Serve" width="56" height="56" style="display: block; width: 56px; height: 56px; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px;">
                    ${eyebrowHtml}
                    <h1 style="margin: 0 0 20px; font-family: ${HEADING_FONT}; font-size: 28px; font-weight: 700; color: ${BRAND_DARK};">
                      ${headingText}
                    </h1>
                    <div style="font-family: ${BODY_FONT}; font-size: 16px; line-height: 1.6; color: ${BRAND_DARK};">
                      ${bodyHtml}
                    </div>
                    ${ctaHtml}
                  </td>
                </tr>
                <tr>
                  <td bgcolor="${ACCENT_LIGHT}" style="padding: 20px 32px; border-top: 1px solid ${DIVIDER_COLOR};">
                    <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 12px; line-height: 1.5; color: ${BRAND_MID};">
                      This is an automated message from Winston Sip and Serve. Replies go to ${REPLY_TO_ADDRESS}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const ctaText_ = showCta ? `\n\n${ctaText}: ${ctaUrl}` : ''
  const text = `${headingText}\n\n${htmlToPlainText(bodyHtml)}${ctaText_}\n\n---\nThis is an automated message from Winston Sip and Serve. Replies go to ${REPLY_TO_ADDRESS}.`

  return { html, text }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
