import crypto from 'crypto'

export const MEMBER_ACTIVATION_TOKEN_HOURS = Number(
  process.env.MEMBER_ACTIVATION_TOKEN_HOURS ?? 48,
)

export function hashActivationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function generateActivationToken(): {
  rawToken: string
  tokenHash: string
  expiresAt: Date
} {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashActivationToken(rawToken)
  const expiresAt = new Date(Date.now() + MEMBER_ACTIVATION_TOKEN_HOURS * 60 * 60 * 1000)
  return { rawToken, tokenHash, expiresAt }
}
