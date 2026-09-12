import type { AnnouncementUrgency } from '@prisma/client'

export const ANNOUNCEMENT_URGENCIES = ['info', 'warning', 'urgent'] as const

export const ANNOUNCEMENT_URGENCY_LABELS: Record<AnnouncementUrgency, string> = {
  info: 'Information',
  warning: 'Warning',
  urgent: 'Urgent',
}

function optionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function optionalDate(formData: FormData, key: string): Date | null | 'invalid' {
  const value = optionalString(formData, key)
  if (value === null) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'invalid' : date
}

export function parseAnnouncementForm(formData: FormData):
  | { error: string }
  | {
      fields: {
        title: string
        message: string
        urgency: AnnouncementUrgency
        isActive: boolean
        startAt: Date
        endAt: Date | null
        autoDisableResources: boolean
        resourceIds: string[]
      }
    } {
  const title = optionalString(formData, 'title')
  const message = optionalString(formData, 'message')
  const urgency = formData.get('urgency')
  const isActive = formData.get('isActive')
  const autoDisableResources = formData.get('autoDisableResources')
  const startAt = optionalDate(formData, 'startAt') ?? new Date()
  const endAt = optionalDate(formData, 'endAt')

  if (!title) return { error: 'Title is required' }
  if (!message) return { error: 'Message is required' }
  if (!(ANNOUNCEMENT_URGENCIES as readonly unknown[]).includes(urgency)) {
    return { error: 'urgency must be info, warning, or urgent' }
  }
  if (isActive !== 'true' && isActive !== 'false') return { error: 'isActive must be a boolean' }
  if (autoDisableResources !== 'true' && autoDisableResources !== 'false') {
    return { error: 'autoDisableResources must be a boolean' }
  }
  if (startAt === 'invalid') return { error: 'startAt must be a valid date' }
  if (endAt === 'invalid') return { error: 'endAt must be a valid date' }
  if (endAt && endAt <= startAt) return { error: 'End date must be after the start date' }

  let resourceIds: string[] = []
  const resourceIdsRaw = formData.get('resourceIds')
  if (typeof resourceIdsRaw === 'string' && resourceIdsRaw.trim()) {
    try {
      const parsed: unknown = JSON.parse(resourceIdsRaw)
      if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
        return { error: 'resourceIds must be an array of strings' }
      }
      resourceIds = Array.from(new Set(parsed))
    } catch {
      return { error: 'resourceIds must be a valid JSON array' }
    }
  }

  return {
    fields: {
      title,
      message,
      urgency: urgency as AnnouncementUrgency,
      isActive: isActive === 'true',
      startAt,
      endAt,
      autoDisableResources: autoDisableResources === 'true' && resourceIds.length > 0,
      resourceIds,
    },
  }
}
