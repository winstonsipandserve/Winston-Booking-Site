import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { uploadToStorage, deleteFromStorage, getPublicUrl } from '@/lib/supabase-storage'

const BUCKET = 'bulletin-images'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}
const VALID_CATEGORIES = ['Renovation', 'Closure', 'Tournament', 'Community'] as const
type BulletinCategoryValue = (typeof VALID_CATEGORIES)[number]
const VALID_SOCIAL_PLATFORMS = ['instagram', 'facebook'] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidCategory(value: unknown): value is BulletinCategoryValue {
  return typeof value === 'string' && (VALID_CATEGORIES as readonly string[]).includes(value)
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function validateImageFile(value: FormDataEntryValue | null): { error: string } | { file: File } {
  if (!(value instanceof File) || value.size === 0) {
    return { error: 'Image is required' }
  }
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
    return { error: 'category must be one of Renovation, Closure, Tournament, Community' }
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

  return {
    fields: {
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      category,
      isPublished: isPublishedRaw === 'true',
      socialPlatform,
      socialUrl,
    },
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
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

  const imageResult = validateImageFile(formData.get('image'))
  if ('error' in imageResult) {
    return Response.json({ error: imageResult.error }, { status: 400 })
  }

  const { fields } = parsed
  const bulletinId = crypto.randomUUID()
  const imagePath = `${bulletinId}/image.${MIME_TO_EXTENSION[imageResult.file.type]}`

  try {
    await uploadToStorage(BUCKET, imagePath, imageResult.file)
  } catch (err) {
    console.error('Bulletin image upload failed', err)
    return Response.json({ error: 'Failed to upload image' }, { status: 500 })
  }

  try {
    const bulletin = await prisma.bulletin.create({
      data: {
        id: bulletinId,
        title: fields.title,
        excerpt: fields.excerpt,
        body: fields.body,
        category: fields.category,
        imageUrl: getPublicUrl(BUCKET, imagePath),
        socialPlatform: fields.socialPlatform,
        socialUrl: fields.socialUrl,
        isPublished: fields.isPublished,
        publishedAt: fields.isPublished ? new Date() : null,
      },
    })

    return Response.json(bulletin, { status: 201 })
  } catch (err) {
    console.error('Bulletin creation failed', err)
    await deleteFromStorage(BUCKET, [imagePath])
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
