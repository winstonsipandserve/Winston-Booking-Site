import crypto from 'crypto'

export const PASSWORD_RESET_TOKEN_HOURS = Number(
  process.env.PASSWORD_RESET_TOKEN_HOURS ?? 1,
)

export function hashPasswordResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function generatePasswordResetToken(): {
  rawToken: string
  tokenHash: string
  expiresAt: Date
} {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashPasswordResetToken(rawToken)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_HOURS * 60 * 60 * 1000)
  return { rawToken, tokenHash, expiresAt }
}
