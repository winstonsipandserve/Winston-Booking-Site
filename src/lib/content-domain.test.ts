import assert from 'node:assert/strict'
import test from 'node:test'
import { announcementIsClaimingResources, announcementIsVisible, sortAnnouncementsByUrgency } from '@/lib/announcement'
import { parseAnnouncementForm } from '@/lib/announcement-validation'
import { createUniqueNewsSlug, newsHtmlToPreview, sanitizeNewsHtml, slugBase } from '@/lib/news'
import { parseNewsForm } from '@/lib/news-validation'

test('announcements order by urgency and then newest start', () => {
  const ordered = sortAnnouncementsByUrgency([
    { id: 'info', urgency: 'info' as const, startAt: new Date('2026-01-03') },
    { id: 'older-urgent', urgency: 'urgent' as const, startAt: new Date('2026-01-01') },
    { id: 'warning', urgency: 'warning' as const, startAt: new Date('2026-01-04') },
    { id: 'newer-urgent', urgency: 'urgent' as const, startAt: new Date('2026-01-02') },
  ])
  assert.deepEqual(ordered.map((item) => item.id), ['newer-urgent', 'older-urgent', 'warning', 'info'])
})

test('announcement resource claims respect inactive, scheduled, active, and expired states', () => {
  const now = new Date('2026-09-13T04:00:00Z')
  const base = { isActive: true, autoDisableResources: true, startAt: new Date('2026-09-13T03:00:00Z'), endAt: null }
  assert.equal(announcementIsClaimingResources(base, now), true)
  assert.equal(announcementIsClaimingResources({ ...base, isActive: false }, now), false)
  assert.equal(announcementIsClaimingResources({ ...base, autoDisableResources: false }, now), false)
  assert.equal(announcementIsClaimingResources({ ...base, startAt: new Date('2026-09-13T05:00:00Z') }, now), false)
  assert.equal(announcementIsClaimingResources({ ...base, endAt: new Date('2026-09-13T04:00:00Z') }, now), false)
})

test('advance notice shows the announcement early without claiming resources early', () => {
  const now = new Date('2026-09-13T04:00:00Z')
  const closure = {
    isActive: true,
    autoDisableResources: true,
    announceAt: new Date('2026-09-10T00:00:00Z'),
    startAt: new Date('2026-09-22T00:00:00Z'),
    endAt: new Date('2026-09-26T00:00:00Z'),
  }
  assert.equal(announcementIsVisible(closure, now), true)
  assert.equal(announcementIsClaimingResources(closure, now), false)
  assert.equal(announcementIsVisible({ ...closure, announceAt: null }, now), false)
  assert.equal(announcementIsVisible({ ...closure, isActive: false }, now), false)
  assert.equal(announcementIsVisible({ ...closure, endAt: new Date('2026-09-13T04:00:00Z') }, now), false)
})

test('announcement input rejects an advance-notice date after the start and drops one equal to it', () => {
  const form = new FormData()
  form.set('title', 'Court notice')
  form.set('message', 'Short message')
  form.set('urgency', 'urgent')
  form.set('isActive', 'true')
  form.set('autoDisableResources', 'false')
  form.set('announceAt', '2026-09-23T00:00:00Z')
  form.set('startAt', '2026-09-22T00:00:00Z')
  assert.deepEqual(parseAnnouncementForm(form), { error: 'The notice cannot be shown after the announcement starts' })

  form.set('announceAt', '2026-09-22T00:00:00Z')
  const same = parseAnnouncementForm(form)
  assert.ok('fields' in same)
  assert.equal(same.fields.announceAt, null)

  form.set('announceAt', '2026-09-15T00:00:00Z')
  const early = parseAnnouncementForm(form)
  assert.ok('fields' in early)
  assert.equal(early.fields.announceAt?.toISOString(), '2026-09-15T00:00:00.000Z')
})

test('announcement input rejects invalid windows and keeps resource linking separate from auto-disable', () => {
  const invalid = new FormData()
  invalid.set('title', 'Court notice')
  invalid.set('message', 'Short message')
  invalid.set('urgency', 'warning')
  invalid.set('isActive', 'true')
  invalid.set('autoDisableResources', 'true')
  invalid.set('startAt', '2026-09-14T10:00:00Z')
  invalid.set('endAt', '2026-09-14T09:00:00Z')
  invalid.set('resourceIds', JSON.stringify(['court-1']))
  assert.deepEqual(parseAnnouncementForm(invalid), { error: 'End date must be after the start date' })

  invalid.set('endAt', '2026-09-14T11:00:00Z')
  invalid.set('autoDisableResources', 'false')
  const parsed = parseAnnouncementForm(invalid)
  assert.ok('fields' in parsed)
  assert.deepEqual(parsed.fields.resourceIds, ['court-1'])
  assert.equal(parsed.fields.autoDisableResources, false)
})

test('news HTML sanitizer removes hostile markup and secures external links', () => {
  const sanitized = sanitizeNewsHtml('<h2>Safe</h2><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a><a href="https://example.com/a">external</a><a href="mailto:club@example.com">mail</a>')
  assert.equal(sanitized.includes('<script'), false)
  assert.equal(sanitized.includes('<img'), false)
  assert.equal(sanitized.includes('javascript:'), false)
  assert.match(sanitized, /href="https:\/\/example\.com\/a" target="_blank" rel="noopener noreferrer"/)
  assert.match(sanitized, /href="mailto:club@example\.com"/)
})

test('news publication defaults to now only when published', () => {
  const draft = new FormData()
  draft.set('title', 'Draft story')
  draft.set('bodyHtml', '<p>Body</p>')
  draft.set('category', 'general')
  draft.set('status', 'draft')
  draft.set('isFeatured', 'false')
  const parsedDraft = parseNewsForm(draft)
  assert.ok('fields' in parsedDraft)
  assert.equal(parsedDraft.fields.publishAt, null)

  draft.set('status', 'published')
  const parsedPublished = parseNewsForm(draft)
  assert.ok('fields' in parsedPublished)
  assert.ok(parsedPublished.fields.publishAt instanceof Date)
})

test('news slugs are stable candidates and collision-safe', async () => {
  assert.equal(slugBase('  Café & Community Night! '), 'cafe-community-night')
  const occupied = new Set(['club-update', 'club-update-2'])
  const slug = await createUniqueNewsSlug('Club Update', async (candidate) => occupied.has(candidate))
  assert.equal(slug, 'club-update-3')
  assert.equal(newsHtmlToPreview('<p>Hello <strong>Winston</strong></p>', 20), 'Hello Winston')
})
