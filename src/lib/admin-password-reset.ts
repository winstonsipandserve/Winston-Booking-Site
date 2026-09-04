import crypto from 'crypto'
import { hashPasswordResetToken } from './password-reset'

export const ADMIN_PASSWORD_RESET_TOKEN_HOURS = Number(
  process.env.ADMIN_PASSWORD_RESET_TOKEN_HOURS ?? 1,
)

export function generateAdminPasswordResetToken(): {
  rawToken: string
  tokenHash: string
  expiresAt: Date
} {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashPasswordResetToken(rawToken)
  const expiresAt = new Date(Date.now() + ADMIN_PASSWORD_RESET_TOKEN_HOURS * 60 * 60 * 1000)
  return { rawToken, tokenHash, expiresAt }
}
