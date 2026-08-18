import { prisma } from '@/lib/prisma'
import { resolveCustomer } from '@/lib/customer-resolution'
import { uploadToStorage, deleteFromStorage } from '@/lib/supabase-storage'

const BUCKET = 'membership-applications'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
const VALID_TIERS = ['three_month', 'six_month', 'twelve_month'] as const
type MembershipTier = (typeof VALID_TIERS)[number]

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && (VALID_TIERS as readonly string[]).includes(value)
}

function validateFile(value: unknown, label: string): { error: string } | { file: File } {
  if (!(value instanceof File) || value.size === 0) {
    return { error: `${label} is required` }
  }
  if (!ALLOWED_MIME_TYPES.includes(value.type)) {
    return { error: `${label} must be a JPEG or PNG image` }
  }
  if (value.size > MAX_FILE_SIZE_BYTES) {
    return { error: `${label} must be 5MB or smaller` }
  }
  return { file: value }
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Malformed form data' }, { status: 400 })
  }

  const name = formData.get('name')
  const email = formData.get('email')
  const phone = formData.get('phone')
  const address = formData.get('address')
  const requestedTier = formData.get('requestedTier')

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
  if (!isValidTier(requestedTier)) {
    return Response.json(
      { error: 'requestedTier must be one of three_month, six_month, twelve_month' },
      { status: 400 },
    )
  }

  const govIdFrontResult = validateFile(formData.get('govIdFront'), 'Government ID (front)')
  if ('error' in govIdFrontResult) {
    return Response.json({ error: govIdFrontResult.error }, { status: 400 })
  }
  const govIdBackResult = validateFile(formData.get('govIdBack'), 'Government ID (back)')
  if ('error' in govIdBackResult) {
    return Response.json({ error: govIdBackResult.error }, { status: 400 })
  }
  const govIdSelfieResult = validateFile(formData.get('govIdSelfie'), 'Selfie with ID')
  if ('error' in govIdSelfieResult) {
    return Response.json({ error: govIdSelfieResult.error }, { status: 400 })
  }

  const govIdFront = govIdFrontResult.file
  const govIdBack = govIdBackResult.file
  const govIdSelfie = govIdSelfieResult.file

  const uploadedPaths: string[] = []

  try {
    const { customer } = await resolveCustomer({ name, phone, email })

    const existingPending = await prisma.membershipApplication.findFirst({
      where: { customerId: customer.id, status: 'pending' },
    })
    if (existingPending) {
      return Response.json(
        { error: 'An application is already pending for this email.' },
        { status: 409 },
      )
    }

    const applicationId = crypto.randomUUID()

    const frontPath = `${applicationId}/gov-id-front.${MIME_TO_EXTENSION[govIdFront.type]}`
    await uploadToStorage(BUCKET, frontPath, govIdFront)
    uploadedPaths.push(frontPath)

    const backPath = `${applicationId}/gov-id-back.${MIME_TO_EXTENSION[govIdBack.type]}`
    await uploadToStorage(BUCKET, backPath, govIdBack)
    uploadedPaths.push(backPath)

    const selfiePath = `${applicationId}/gov-id-selfie.${MIME_TO_EXTENSION[govIdSelfie.type]}`
    await uploadToStorage(BUCKET, selfiePath, govIdSelfie)
    uploadedPaths.push(selfiePath)

    const application = await prisma.membershipApplication.create({
      data: {
        id: applicationId,
        customerId: customer.id,
        requestedTier,
        address,
        contactNumber: phone,
        govIdFrontUrl: frontPath,
        govIdBackUrl: backPath,
        govIdSelfieUrl: selfiePath,
      },
    })

    return Response.json(
      { id: application.id, status: application.status, submittedAt: application.createdAt },
      { status: 201 },
    )
  } catch (err) {
    console.error('Membership application creation failed', err)
    if (uploadedPaths.length > 0) {
      await deleteFromStorage(BUCKET, uploadedPaths)
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
