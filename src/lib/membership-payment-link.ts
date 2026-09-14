import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS = Number(
  process.env.MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS ?? 48,
)

export function hashPaymentLinkToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function generatePaymentLinkToken(): {
  rawToken: string
  tokenHash: string
  expiresAt: Date
} {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashPaymentLinkToken(rawToken)
  const expiresAt = new Date(Date.now() + MEMBERSHIP_PAYMENT_LINK_TOKEN_HOURS * 60 * 60 * 1000)
  return { rawToken, tokenHash, expiresAt }
}

export type PaymentLinkTokenLookupResult =
  | { ok: true }
  | { ok: false; error: string; status: number }

/** Shared by the payment page (pre-check, no mutation) and the checkout API (real
 * enforcement) so both agree on what counts as invalid/superseded/expired. Unlike an
 * activation token, this one is never marked used by a single successful action — a
 * customer can make several checkout attempts before paying — so validity here is purely
 * about supersession (a newer resend) and expiry. */
export async function lookupPaymentLinkToken(
  applicationId: string,
  rawToken: string,
): Promise<PaymentLinkTokenLookupResult> {
  const tokenHash = hashPaymentLinkToken(rawToken)
  const linkToken = await prisma.membershipPaymentLinkToken.findUnique({ where: { tokenHash } })

  if (!linkToken || linkToken.applicationId !== applicationId) {
    return { ok: false, error: 'Invalid payment link', status: 404 }
  }
  if (linkToken.usedAt) {
    return { ok: false, error: 'This payment link is no longer valid', status: 409 }
  }
  if (linkToken.expiresAt < new Date()) {
    return { ok: false, error: 'This payment link has expired', status: 409 }
  }
  return { ok: true }
}
