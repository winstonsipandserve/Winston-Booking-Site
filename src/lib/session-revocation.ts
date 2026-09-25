/**
 * True when a session token was issued before the account's password last changed.
 * Tokens from before `authAt` existed carry 0, so any later password change revokes them.
 */
export function isSessionRevokedByPasswordChange(
  authAtMs: number,
  passwordChangedAt: Date | null,
): boolean {
  return passwordChangedAt !== null && authAtMs < passwordChangedAt.getTime()
}
