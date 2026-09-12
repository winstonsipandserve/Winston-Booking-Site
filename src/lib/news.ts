import sanitizeHtml from 'sanitize-html'

export const NEWS_CATEGORIES = ['tournament', 'community', 'promo', 'general'] as const
export const NEWS_STATUSES = ['draft', 'published'] as const

export const NEWS_CATEGORY_LABELS: Record<(typeof NEWS_CATEGORIES)[number], string> = {
  tournament: 'Tournament',
  community: 'Community',
  promo: 'Promotion',
  general: 'General',
}

export function sanitizeNewsHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'br', 'a'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href ?? ''
        const external = /^https?:\/\//i.test(href)
        const safeAttributes: Record<string, string> = external
          ? { href, target: '_blank', rel: 'noopener noreferrer' }
          : { href }
        return {
          tagName: 'a',
          attribs: safeAttributes,
        }
      },
    },
  }).trim()
}

export function newsHtmlToPreview(value: string, maxLength = 180): string {
  const text = sanitizeHtml(value.replace(/<\/?(?:p|h[1-6]|li|blockquote|br|ul|ol)[^>]*>/gi, ' '), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, ' ')
    .trim()
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}…`
}

export function slugBase(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'news'
}

export async function createUniqueNewsSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugBase(title)
  if (!(await exists(base))) return base
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base}-${suffix}`
    if (!(await exists(candidate))) return candidate
  }
  throw new Error('Unable to generate a unique news slug')
}
