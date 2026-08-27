import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { uploadToStorage, deleteFromStorage, getPublicUrl } from '@/lib/supabase-storage'

const BUCKET = 'bulletin-images'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}
const VALID_CATEGORIES = [
  'Renovation',
  'Closure',
  'Tournament',
  'Community',
  'General',
  'FacilityMaintenance',
] as const
type BulletinCategoryValue = (typeof VALID_CATEGORIES)[number]
const VALID_SOCIAL_PLATFORMS = ['instagram', 'facebook'] as const
const VALID_PRIORITIES = ['Normal', 'High'] as const
type BulletinPriorityValue = (typeof VALID_PRIORITIES)[number]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidCategory(value: unknown): value is BulletinCategoryValue {
  return typeof value === 'string' && (VALID_CATEGORIES as readonly string[]).includes(value)
}

function isValidPriority(value: unknown): value is BulletinPriorityValue {
  return typeof value === 'string' && (VALID_PRIORITIES as readonly string[]).includes(value)
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function parseOptionalDate(formData: FormData, key: string): { error: string } | { value: Date | null } {
  const raw = getOptionalString(formData, key)
  if (raw === null) return { value: null }
  const date = new Date(raw)
  if (isNaN(date.getTime())) return { error: `${key} must be a valid date` }
  return { value: date }
}

function validateImageFile(value: File): { error: string } | { file: File } {
  if (!ALLOWED_MIME_TYPES.includes(value.type)) {
    return { error: 'Image must be a JPEG or PNG image' }
  }
  if (value.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'Image must be 5MB or smaller' }
  }
  return { file: value }
}

interface ParsedBulletinFields {
  title: string
  excerpt: string
  body: string
  category: BulletinCategoryValue
  isPublished: boolean
  socialPlatform: string | null
  socialUrl: string | null
  priority: BulletinPriorityValue
  affectedFacility: string | null
  impact: string | null
  action: string | null
  eventStartAt: Date | null
  eventEndAt: Date | null
  expiresAt: Date | null
  ctaLabel: string | null
  ctaUrl: string | null
}

function parseCommonFields(formData: FormData): { error: string } | { fields: ParsedBulletinFields } {
  const title = formData.get('title')
  const excerpt = formData.get('excerpt')
  const body = formData.get('body')
  const category = formData.get('category')
  const isPublishedRaw = formData.get('isPublished')

  if (!isNonEmptyString(title)) return { error: 'Title is required' }
  if (!isNonEmptyString(excerpt)) return { error: 'Excerpt is required' }
  if (!isNonEmptyString(body)) return { error: 'Body is required' }
  if (!isValidCategory(category)) {
    return {
      error:
        'category must be one of Renovation, Closure, Tournament, Community, General, FacilityMaintenance',
    }
  }
  if (isPublishedRaw !== 'true' && isPublishedRaw !== 'false') {
    return { error: 'isPublished must be a boolean' }
  }

  const socialPlatform = getOptionalString(formData, 'socialPlatform')
  const socialUrl = getOptionalString(formData, 'socialUrl')
  if ((socialPlatform === null) !== (socialUrl === null)) {
    return { error: 'socialPlatform and socialUrl must be provided together' }
  }
  if (socialPlatform !== null && !(VALID_SOCIAL_PLATFORMS as readonly string[]).includes(socialPlatform)) {
    return { error: 'socialPlatform must be instagram or facebook' }
  }

  const priorityRaw = formData.get('priority')
  const priority = priorityRaw === null || priorityRaw === '' ? 'Normal' : priorityRaw
  if (!isValidPriority(priority)) {
    return { error: 'priority must be Normal or High' }
  }

  const affectedFacility = getOptionalString(formData, 'affectedFacility')
  const impact = getOptionalString(formData, 'impact')
  const action = getOptionalString(formData, 'action')

  const ctaLabel = getOptionalString(formData, 'ctaLabel')
  const ctaUrl = getOptionalString(formData, 'ctaUrl')
  if ((ctaLabel === null) !== (ctaUrl === null)) {
    return { error: 'ctaLabel and ctaUrl must be provided together' }
  }

  const eventStartAtResult = parseOptionalDate(formData, 'eventStartAt')
  if ('error' in eventStartAtResult) return { error: eventStartAtResult.error }
  const eventEndAtResult = parseOptionalDate(formData, 'eventEndAt')
  if ('error' in eventEndAtResult) return { error: eventEndAtResult.error }
  const expiresAtResult = parseOptionalDate(formData, 'expiresAt')
  if ('error' in expiresAtResult) return { error: expiresAtResult.error }

  return {
    fields: {
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      category,
      isPublished: isPublishedRaw === 'true',
      socialPlatform,
      socialUrl,
      priority,
      affectedFacility,
      impact,
      action,
      eventStartAt: eventStartAtResult.value,
      eventEndAt: eventEndAtResult.value,
      expiresAt: expiresAtResult.value,
      ctaLabel,
      ctaUrl,
    },
  }
}

function extractStoragePath(imageUrl: string): string | null {
  const publicUrlPrefix = getPublicUrl(BUCKET, '')
  return imageUrl.startsWith(publicUrlPrefix) ? imageUrl.slice(publicUrlPrefix.length) : null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.bulletin.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Bulletin not found' }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Malformed form data' }, { status: 400 })
  }

  const parsed = parseCommonFields(formData)
  if ('error' in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 })
  }

  const imageValue = formData.get('image')
  let newImagePath: string | null = null
  let newImageUrl: string | null = null

  if (imageValue instanceof File && imageValue.size > 0) {
    const imageResult = validateImageFile(imageValue)
    if ('error' in imageResult) {
      return Response.json({ error: imageResult.error }, { status: 400 })
    }
    newImagePath = `${id}/image-${Date.now()}.${MIME_TO_EXTENSION[imageResult.file.type]}`
    try {
      await uploadToStorage(BUCKET, newImagePath, imageResult.file)
    } catch (err) {
      console.error('Bulletin image upload failed', err)
      return Response.json({ error: 'Failed to upload image' }, { status: 500 })
    }
    newImageUrl = getPublicUrl(BUCKET, newImagePath)
  }

  const { fields } = parsed
  const publishedAt =
    fields.isPublished && existing.publishedAt === null ? new Date() : existing.publishedAt

  try {
    const bulletin = await prisma.bulletin.update({
      where: { id },
      data: {
        title: fields.title,
        excerpt: fields.excerpt,
        body: fields.body,
        category: fields.category,
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
        socialPlatform: fields.socialPlatform,
        socialUrl: fields.socialUrl,
        priority: fields.priority,
        affectedFacility: fields.affectedFacility,
        impact: fields.impact,
        action: fields.action,
        eventStartAt: fields.eventStartAt,
        eventEndAt: fields.eventEndAt,
        expiresAt: fields.expiresAt,
        ctaLabel: fields.ctaLabel,
        ctaUrl: fields.ctaUrl,
        isPublished: fields.isPublished,
        publishedAt,
      },
    })

    if (newImagePath) {
      const oldPath = extractStoragePath(existing.imageUrl)
      if (oldPath) {
        await deleteFromStorage(BUCKET, [oldPath])
      }
    }

    return Response.json(bulletin, { status: 200 })
  } catch (err) {
    console.error('Bulletin update failed', err)
    if (newImagePath) {
      await deleteFromStorage(BUCKET, [newImagePath])
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.bulletin.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Bulletin not found' }, { status: 404 })
  }

  await prisma.bulletin.delete({ where: { id } })

  const path = extractStoragePath(existing.imageUrl)
  if (path) {
    await deleteFromStorage(BUCKET, [path])
  }

  return Response.json({ success: true }, { status: 200 })
}
