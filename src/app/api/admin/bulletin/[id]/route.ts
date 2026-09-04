import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { uploadToStorage, deleteFromStorage, getPublicUrl } from '@/lib/supabase-storage'
import { MIME_TO_EXTENSION, BULLETIN_CATEGORY_RULES, parseCommonFields, validateImageFile } from '@/lib/bulletin-validation'

const BUCKET = 'bulletin-images'

function extractStoragePath(imageUrl: string): string | null {
  const publicUrlPrefix = getPublicUrl(BUCKET, '')
  return imageUrl.startsWith(publicUrlPrefix) ? imageUrl.slice(publicUrlPrefix.length) : null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
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

  const { fields } = parsed
  const imageValue = formData.get('image')
  const hasNewImageFile = imageValue instanceof File && imageValue.size > 0

  if (
    BULLETIN_CATEGORY_RULES[fields.category].requireImage &&
    !hasNewImageFile &&
    existing.imageUrl === null
  ) {
    return Response.json({ error: 'Image is required for this category' }, { status: 400 })
  }

  let newImagePath: string | null = null
  let newImageUrl: string | null = null

  if (hasNewImageFile) {
    const imageResult = validateImageFile(imageValue as File)
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

    if (newImagePath && existing.imageUrl) {
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
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.bulletin.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Bulletin not found' }, { status: 404 })
  }

  await prisma.bulletin.delete({ where: { id } })

  const path = existing.imageUrl ? extractStoragePath(existing.imageUrl) : null
  if (path) {
    await deleteFromStorage(BUCKET, [path])
  }

  return Response.json({ success: true }, { status: 200 })
}
