import crypto from 'crypto'
import type { MembershipPaymentLinkToken } from '@prisma/client'
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

type LinkTokenValidation =
  | { ok: true; linkToken: MembershipPaymentLinkToken }
  | { ok: false; error: string; status: number }

/** Shared by both payment pages (pre-check, no mutation) and both checkout APIs (real
 * enforcement) so all four agree on what counts as invalid/superseded/expired. Unlike an
 * activation token, this one is never marked used by a single successful action — a
 * customer can make several checkout attempts before paying — so validity here is purely
 * about supersession (a newer resend) and expiry. Looking the token up by hash first, then
 * checking which id it belongs to, keeps a token for one link kind from validating against
 * the other's id. */
async function validateLinkToken(rawToken: string): Promise<LinkTokenValidation> {
  const tokenHash = hashPaymentLinkToken(rawToken)
  const linkToken = await prisma.membershipPaymentLinkToken.findUnique({ where: { tokenHash } })

  if (!linkToken) {
    return { ok: false, error: 'Invalid payment link', status: 404 }
  }
  if (linkToken.usedAt) {
    return { ok: false, error: 'This payment link is no longer valid', status: 409 }
  }
  if (linkToken.expiresAt < new Date()) {
    return { ok: false, error: 'This payment link has expired', status: 409 }
  }
  return { ok: true, linkToken }
}

/** Gates the application-approval payment link: /membership/pay/[id] and
 * POST /api/membership-payments. */
export async function lookupApplicationPaymentLinkToken(
  applicationId: string,
  rawToken: string,
): Promise<PaymentLinkTokenLookupResult> {
  const result = await validateLinkToken(rawToken)
  if (!result.ok) return result
  if (result.linkToken.applicationId !== applicationId) {
    return { ok: false, error: 'Invalid payment link', status: 404 }
  }
  return { ok: true }
}

/** Gates the admin-initiated renewal payment link: /membership/renew/[id] and
 * POST /api/membership-payments/[id]/checkout. */
export async function lookupRenewalPaymentLinkToken(
  membershipPaymentId: string,
  rawToken: string,
): Promise<PaymentLinkTokenLookupResult> {
  const result = await validateLinkToken(rawToken)
  if (!result.ok) return result
  if (result.linkToken.membershipPaymentId !== membershipPaymentId) {
    return { ok: false, error: 'Invalid payment link', status: 404 }
  }
  return { ok: true }
}
