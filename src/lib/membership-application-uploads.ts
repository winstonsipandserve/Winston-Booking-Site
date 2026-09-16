import { randomUUID } from 'crypto'

export const MEMBERSHIP_APPLICATION_BUCKET = 'membership-applications'
export const MAX_MEMBERSHIP_APPLICATION_FILE_BYTES = 5 * 1024 * 1024
export const MEMBERSHIP_APPLICATION_UPLOAD_PREFIX = 'pending'

export const MEMBERSHIP_APPLICATION_UPLOADS = {
  govIdFront: { label: 'Government ID (front)' },
  govIdBack: { label: 'Government ID (back)' },
  govIdSelfie: { label: 'Selfie with ID' },
} as const

export type MembershipApplicationUploadSlot = keyof typeof MEMBERSHIP_APPLICATION_UPLOADS

export function isMembershipApplicationUploadSlot(value: unknown): value is MembershipApplicationUploadSlot {
  return typeof value === 'string' && value in MEMBERSHIP_APPLICATION_UPLOADS
}

export function isUploadSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function createUploadSessionId(): string {
  return randomUUID()
}

export function isMembershipApplicationImageType(value: unknown): value is 'image/jpeg' | 'image/png' {
  return value === 'image/jpeg' || value === 'image/png'
}

export function getPendingUploadPath(
  sessionId: string,
  slot: MembershipApplicationUploadSlot,
  contentType: 'image/jpeg' | 'image/png',
): string {
  const extension = contentType === 'image/jpeg' ? 'jpg' : 'png'
  return `${MEMBERSHIP_APPLICATION_UPLOAD_PREFIX}/${sessionId}/${slot}.${extension}`
}

export function getPendingUploadPaths(sessionId: string): string[] {
  return (Object.keys(MEMBERSHIP_APPLICATION_UPLOADS) as MembershipApplicationUploadSlot[]).flatMap((slot) =>
    ['image/jpeg', 'image/png'].map((contentType) =>
      getPendingUploadPath(sessionId, slot, contentType as 'image/jpeg' | 'image/png'),
    ),
  )
}
