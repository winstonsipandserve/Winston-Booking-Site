import { prisma } from '@/lib/prisma'
import { resolveCustomer } from '@/lib/customer-resolution'
import { deleteFromStorage, downloadFromStorage, uploadToStorage } from '@/lib/supabase-storage'
import { sendStaffMembershipApplicationEmail } from '@/lib/resend'
import { getMembershipDisplayStatus } from '@/lib/membership-display-status'
import { getCurrentMembership } from '@/lib/membership-current'
import { sanitizeMembershipApplicationImageData, type SanitizedImage } from '@/lib/image-validation'
import {
  getPendingUploadPath,
  isMembershipApplicationImageType,
  isMembershipApplicationUploadSlot,
  isUploadSessionId,
  MEMBERSHIP_APPLICATION_BUCKET,
  MEMBERSHIP_APPLICATION_UPLOADS,
  type MembershipApplicationUploadSlot,
} from '@/lib/membership-application-uploads'

const VALID_TIERS = ['player', 'premier', 'elite'] as const
type MembershipTier = (typeof VALID_TIERS)[number]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar date (YYYY-MM-DD) that is not in the future, as a UTC-midnight Date. */
function parseDateOfBirth(value: unknown): Date | null {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null
  if (parsed.getTime() > Date.now()) return null
  return parsed
}

function isValidTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && (VALID_TIERS as readonly string[]).includes(value)
}

type UploadedImageReference = {
  slot: MembershipApplicationUploadSlot
  contentType: 'image/jpeg' | 'image/png'
}

function parseUploadedImages(value: unknown): UploadedImageReference[] | null {
  if (!Array.isArray(value) || value.length !== 3) return null
  const seen = new Set<MembershipApplicationUploadSlot>()
  const uploads: UploadedImageReference[] = []
  for (const valueItem of value) {
    if (!valueItem || typeof valueItem !== 'object') return null
    const { slot, contentType } = valueItem as { slot?: unknown; contentType?: unknown }
    if (!isMembershipApplicationUploadSlot(slot) || !isMembershipApplicationImageType(contentType) || seen.has(slot)) {
      return null
    }
    seen.add(slot)
    uploads.push({ slot, contentType })
  }
  return uploads
}

async function getBlockedApplicationResponse(customerId: string): Promise<Response | null> {
  const latestApplication = await prisma.membershipApplication.findFirst({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  })
  if (!latestApplication) return null

  // Renewals create memberships with no application attached, so the customer's
  // current row — not the one tied to the original application — decides active/expired.
  const displayStatus = getMembershipDisplayStatus({
    status: latestApplication.status,
    latestMembership: await getCurrentMembership(customerId),
  })
  if (displayStatus === 'pending') {
    return Response.json({ error: 'An application is already pending for this email.' }, { status: 409 })
  }
  if (displayStatus === 'awaiting_payment') {
    return Response.json(
      {
        error:
          'Your previous application was approved and is awaiting payment. Please check your email for the payment link, or contact us if you need it resent.',
      },
      { status: 409 },
    )
  }
  if (displayStatus === 'active') {
    return Response.json(
      {
        error: "This email already has an active membership. Please contact us if you'd like to renew or make changes.",
      },
      { status: 409 },
    )
  }
  if (displayStatus === 'expired') {
    return Response.json(
      {
        error: 'Your membership has expired. Please log in to your account to renew instead of submitting a new application.',
      },
      { status: 409 },
    )
  }

  // A rejected most-recent application permits a reapplication.
  return null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const { name, email, phone, address, dateOfBirth, requestedTier, uploadSessionId } = body ?? {}

  if (!isNonEmptyString(name)) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!isNonEmptyString(email)) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!isNonEmptyString(phone)) {
    return Response.json({ error: 'Phone is required' }, { status: 400 })
  }
  if (!isNonEmptyString(address)) {
    return Response.json({ error: 'Address is required' }, { status: 400 })
  }
  const parsedDateOfBirth = parseDateOfBirth(dateOfBirth)
  if (!parsedDateOfBirth) {
    return Response.json({ error: 'Date of birth must be a valid past date (YYYY-MM-DD)' }, { status: 400 })
  }
  if (!isValidTier(requestedTier)) {
    return Response.json(
      { error: 'requestedTier must be one of player, premier, elite' },
      { status: 400 },
    )
  }

  if (!isUploadSessionId(uploadSessionId)) {
    return Response.json({ error: 'Your document upload session is invalid. Please choose the files again.' }, { status: 400 })
  }
  const uploadedImages = parseUploadedImages(body?.uploads)
  if (!uploadedImages) {
    return Response.json({ error: 'All three government ID images are required.' }, { status: 400 })
  }

  const uploadedPaths: string[] = []

  try {
    const sanitizedImages = new Map<MembershipApplicationUploadSlot, SanitizedImage>()
    for (const { slot, contentType } of uploadedImages) {
      const label = MEMBERSHIP_APPLICATION_UPLOADS[slot].label
      try {
        const data = await downloadFromStorage(
          MEMBERSHIP_APPLICATION_BUCKET,
          getPendingUploadPath(uploadSessionId, slot, contentType),
        )
        sanitizedImages.set(slot, await sanitizeMembershipApplicationImageData(data, contentType))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'could not be processed as an image'
        return Response.json({ error: `${label} ${message}` }, { status: 400 })
      }
    }

    // An application may create a Customer but never mutates an existing profile:
    // control of an email has not yet been verified on this public endpoint.
    const { customer } = await resolveCustomer({ name, phone, email })
    const blockedResponse = await getBlockedApplicationResponse(customer.id)
    if (blockedResponse) return blockedResponse

    const applicationId = crypto.randomUUID()

    const govIdFront = sanitizedImages.get('govIdFront')!
    const govIdBack = sanitizedImages.get('govIdBack')!
    const govIdSelfie = sanitizedImages.get('govIdSelfie')!

    const frontPath = `${applicationId}/gov-id-front.${govIdFront.extension}`
    await uploadToStorage(MEMBERSHIP_APPLICATION_BUCKET, frontPath, govIdFront)
    uploadedPaths.push(frontPath)

    const backPath = `${applicationId}/gov-id-back.${govIdBack.extension}`
    await uploadToStorage(MEMBERSHIP_APPLICATION_BUCKET, backPath, govIdBack)
    uploadedPaths.push(backPath)

    const selfiePath = `${applicationId}/gov-id-selfie.${govIdSelfie.extension}`
    await uploadToStorage(MEMBERSHIP_APPLICATION_BUCKET, selfiePath, govIdSelfie)
    uploadedPaths.push(selfiePath)

    const application = await prisma.membershipApplication.create({
      data: {
        id: applicationId,
        customerId: customer.id,
        requestedTier,
        dateOfBirth: parsedDateOfBirth,
        address,
        contactNumber: phone,
        govIdFrontUrl: frontPath,
        govIdBackUrl: backPath,
        govIdSelfieUrl: selfiePath,
      },
    })

    await sendStaffMembershipApplicationEmail({
      applicationId: application.id,
      customerName: customer.name,
      customerEmail: customer.email,
      contactNumber: phone,
      address,
      requestedTier: application.requestedTier,
      submittedAt: application.createdAt,
    })

    return Response.json(
      { id: application.id, status: application.status, submittedAt: application.createdAt },
      { status: 201 },
    )
  } catch (err) {
    console.error('Membership application creation failed', err)
    if (uploadedPaths.length > 0) {
      await deleteFromStorage(MEMBERSHIP_APPLICATION_BUCKET, uploadedPaths)
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await deleteFromStorage(
      MEMBERSHIP_APPLICATION_BUCKET,
      uploadedImages.map(({ slot, contentType }) => getPendingUploadPath(uploadSessionId, slot, contentType)),
    )
  }
}
