import type { NewsCategory, NewsStatus } from '@prisma/client'
import { NEWS_CATEGORIES, NEWS_STATUSES, sanitizeNewsHtml } from '@/lib/news'

function optionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function parseNewsForm(formData: FormData):
  | { error: string }
  | {
      fields: {
        title: string
        bodyHtml: string
        category: NewsCategory
        status: NewsStatus
        publishAt: Date | null
        isFeatured: boolean
      }
    } {
  const title = optionalString(formData, 'title')
  const rawBodyHtml = optionalString(formData, 'bodyHtml')
  const category = formData.get('category')
  const status = formData.get('status')
  const isFeatured = formData.get('isFeatured')
  const publishAtRaw = optionalString(formData, 'publishAt')

  if (!title) return { error: 'Title is required' }
  if (!rawBodyHtml) return { error: 'Body is required' }
  if (!(NEWS_CATEGORIES as readonly unknown[]).includes(category)) {
    return { error: 'category must be tournament, community, promo, or general' }
  }
  if (!(NEWS_STATUSES as readonly unknown[]).includes(status)) {
    return { error: 'status must be draft or published' }
  }
  if (isFeatured !== 'true' && isFeatured !== 'false') return { error: 'isFeatured must be a boolean' }

  let publishAt: Date | null = null
  if (publishAtRaw) {
    publishAt = new Date(publishAtRaw)
    if (Number.isNaN(publishAt.getTime())) return { error: 'publishAt must be a valid date' }
  }
  if (status === 'published' && publishAt === null) publishAt = new Date()

  const bodyHtml = sanitizeNewsHtml(rawBodyHtml)
  const bodyText = sanitizeHtmlForValidation(bodyHtml)
  if (!bodyText) return { error: 'Body must contain readable text' }

  return {
    fields: {
      title,
      bodyHtml,
      category: category as NewsCategory,
      status: status as NewsStatus,
      publishAt,
      isFeatured: isFeatured === 'true',
    },
  }
}

function sanitizeHtmlForValidation(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}
