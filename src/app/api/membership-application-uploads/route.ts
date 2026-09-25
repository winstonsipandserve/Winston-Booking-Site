import { consumeRateLimitAttempt, getClientIp, hashIdentifier } from '@/lib/auth-rate-limit'
import {
  createUploadSessionId,
  getPendingUploadPath,
  getPendingUploadPaths,
  isMembershipApplicationImageType,
  isMembershipApplicationUploadSlot,
  MAX_MEMBERSHIP_APPLICATION_FILE_BYTES,
  MEMBERSHIP_APPLICATION_BUCKET,
  MEMBERSHIP_APPLICATION_UPLOADS,
} from '@/lib/membership-application-uploads'
import { createSignedUploadUrl, deleteFromStorage } from '@/lib/supabase-storage'

const APPLICATIONS_PER_IP_PER_WINDOW = 3
const RATE_LIMIT_ERROR = 'Too many applications from this connection. Please wait a few minutes and try again.'

type RequestedUpload = {
  slot?: unknown
  contentType?: unknown
  size?: unknown
}

function validRequestedUploads(value: unknown): value is RequestedUpload[] {
  if (!Array.isArray(value) || value.length !== 3) return false
  const seen = new Set<string>()
  return value.every((upload) => {
    if (!upload || typeof upload !== 'object') return false
    const { slot, contentType, size } = upload as RequestedUpload
    if (!isMembershipApplicationUploadSlot(slot) || seen.has(slot)) return false
    seen.add(slot)
    return (
      isMembershipApplicationImageType(contentType) &&
      typeof size === 'number' &&
      Number.isInteger(size) &&
      size > 0 &&
      size <= MAX_MEMBERSHIP_APPLICATION_FILE_BYTES
    )
  })
}

export async function POST(request: Request) {
  const rateLimitKeys = [
    { identifierHash: hashIdentifier(`ip:${getClientIp(request)}`), maximumAttempts: APPLICATIONS_PER_IP_PER_WINDOW },
  ]
  if (!(await consumeRateLimitAttempt('membership_application', rateLimitKeys))) {
    return Response.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (!validRequestedUploads(body?.uploads)) {
    return Response.json({ error: 'Provide one JPEG or PNG image, 5MB or smaller, for each required document.' }, { status: 400 })
  }

  const sessionId = createUploadSessionId()
  try {
    const uploads = await Promise.all(
      body.uploads.map(async (upload: RequestedUpload) => {
        const slot = upload.slot as keyof typeof MEMBERSHIP_APPLICATION_UPLOADS
        const contentType = upload.contentType as 'image/jpeg' | 'image/png'
        return {
          slot,
          contentType,
          signedUrl: await createSignedUploadUrl(
            MEMBERSHIP_APPLICATION_BUCKET,
            getPendingUploadPath(sessionId, slot, contentType),
          ),
        }
      }),
    )
    return Response.json({ sessionId, uploads }, { status: 201 })
  } catch (error) {
    console.error('Membership application signed upload creation failed', error)
    await deleteFromStorage(MEMBERSHIP_APPLICATION_BUCKET, getPendingUploadPaths(sessionId))
    return Response.json({ error: 'Unable to prepare secure document uploads. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null)
  if (typeof body?.sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.sessionId)) {
    return Response.json({ error: 'Invalid upload session.' }, { status: 400 })
  }

  await deleteFromStorage(MEMBERSHIP_APPLICATION_BUCKET, getPendingUploadPaths(body.sessionId))
  return new Response(null, { status: 204 })
}
