export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export const VALID_CATEGORIES = [
  'Renovation',
  'Closure',
  'Tournament',
  'Community',
  'General',
  'FacilityMaintenance',
] as const
export type BulletinCategoryValue = (typeof VALID_CATEGORIES)[number]

export const VALID_SOCIAL_PLATFORMS = ['instagram', 'facebook'] as const

/** Which fields a category requires, beyond the fields required for every category. */
export const BULLETIN_CATEGORY_RULES: Record<
  BulletinCategoryValue,
  {
    requireImage: boolean
    requireEventEndAt: boolean
    requireExpiresAt: boolean
    requireCta: boolean
  }
> = {
  Renovation: { requireImage: true, requireEventEndAt: true, requireExpiresAt: true, requireCta: false },
  Closure: { requireImage: false, requireEventEndAt: true, requireExpiresAt: true, requireCta: false },
  Tournament: { requireImage: true, requireEventEndAt: true, requireExpiresAt: true, requireCta: true },
  Community: { requireImage: true, requireEventEndAt: true, requireExpiresAt: true, requireCta: true },
  General: { requireImage: false, requireEventEndAt: false, requireExpiresAt: false, requireCta: false },
  FacilityMaintenance: { requireImage: false, requireEventEndAt: true, requireExpiresAt: true, requireCta: false },
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidCategory(value: unknown): value is BulletinCategoryValue {
  return typeof value === 'string' && (VALID_CATEGORIES as readonly string[]).includes(value)
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function parseOptionalDate(formData: FormData, key: string): { error: string } | { value: Date | null } {
  const raw = getOptionalString(formData, key)
  if (raw === null) return { value: null }
  const date = new Date(raw)
  if (isNaN(date.getTime())) return { error: `${key} must be a valid date` }
  return { value: date }
}

/** MIME/size checks for an image that IS provided. Whether an image is required at all is decided by the caller. */
export function validateImageFile(value: File): { error: string } | { file: File } {
  if (!ALLOWED_MIME_TYPES.includes(value.type)) {
    return { error: 'Image must be a JPEG or PNG image' }
  }
  if (value.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'Image must be 5MB or smaller' }
  }
  return { file: value }
}

export interface ParsedBulletinFields {
  title: string
  excerpt: string
  body: string
  category: BulletinCategoryValue
  isPublished: boolean
  socialPlatform: string | null
  socialUrl: string | null
  affectedFacility: string
  impact: string
  action: string
  eventStartAt: Date
  eventEndAt: Date | null
  expiresAt: Date | null
  ctaLabel: string | null
  ctaUrl: string | null
}

export function parseCommonFields(formData: FormData): { error: string } | { fields: ParsedBulletinFields } {
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
      error: 'category must be one of Renovation, Closure, Tournament, Community, General, FacilityMaintenance',
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

  const affectedFacility = getOptionalString(formData, 'affectedFacility')
  if (affectedFacility === null) return { error: 'Affected Facility is required' }
  const impact = getOptionalString(formData, 'impact')
  if (impact === null) return { error: 'Impact is required' }
  const action = getOptionalString(formData, 'action')
  if (action === null) return { error: 'Action is required' }

  const ctaLabel = getOptionalString(formData, 'ctaLabel')
  const ctaUrl = getOptionalString(formData, 'ctaUrl')
  if ((ctaLabel === null) !== (ctaUrl === null)) {
    return { error: 'ctaLabel and ctaUrl must be provided together' }
  }

  const eventStartAtResult = parseOptionalDate(formData, 'eventStartAt')
  if ('error' in eventStartAtResult) return { error: eventStartAtResult.error }
  if (eventStartAtResult.value === null) return { error: 'Event Start is required' }
  const eventEndAtResult = parseOptionalDate(formData, 'eventEndAt')
  if ('error' in eventEndAtResult) return { error: eventEndAtResult.error }
  const expiresAtResult = parseOptionalDate(formData, 'expiresAt')
  if ('error' in expiresAtResult) return { error: expiresAtResult.error }

  const rules = BULLETIN_CATEGORY_RULES[category]
  if (rules.requireEventEndAt && eventEndAtResult.value === null) {
    return { error: 'Event End is required for this category' }
  }
  if (rules.requireExpiresAt && expiresAtResult.value === null) {
    return { error: 'Expiration is required for this category' }
  }
  if (rules.requireCta && (ctaLabel === null || ctaUrl === null)) {
    return { error: 'CTA Label and CTA URL are required for this category' }
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
