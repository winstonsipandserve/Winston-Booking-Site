import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { parseNewsForm } from '@/lib/news-validation'
import { MIME_TO_EXTENSION, validateImageFile } from '@/lib/content-image-validation'
import { deleteFromStorage, getPublicUrl, uploadToStorage } from '@/lib/supabase-storage'

const BUCKET = 'bulletin-images'

function storagePath(url: string): string | null {
  const prefix = getPublicUrl(BUCKET, '')
  return url.startsWith(prefix) ? url.slice(prefix.length) : null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await prisma.newsPost.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'News post not found' }, { status: 404 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Malformed form data' }, { status: 400 })
  }
  const parsed = parseNewsForm(formData)
  if ('error' in parsed) return Response.json({ error: parsed.error }, { status: 400 })

  const image = formData.get('coverImage')
  const hasNewImage = image instanceof File && image.size > 0
  const removeCover = formData.get('removeCover') === 'true'
  if (parsed.fields.status === 'published' && !hasNewImage && (!existing.coverImageUrl || removeCover)) {
    return Response.json({ error: 'A cover image is required before publishing' }, { status: 400 })
  }

  let newPath: string | null = null
  let coverImageUrl: string | null = null
  if (hasNewImage) {
    const validated = await validateImageFile(image)
    if ('error' in validated) return Response.json({ error: validated.error }, { status: 400 })
    newPath = `news/${id}/cover-${Date.now()}.${MIME_TO_EXTENSION[validated.file.type]}`
    try {
      await uploadToStorage(BUCKET, newPath, validated.file)
      coverImageUrl = getPublicUrl(BUCKET, newPath)
    } catch (error) {
      console.error('News cover upload failed', error)
      return Response.json({ error: 'Failed to upload cover image' }, { status: 500 })
    }
  }

  try {
    const post = await prisma.newsPost.update({
      where: { id },
      data: {
        ...parsed.fields,
        ...(coverImageUrl ? { coverImageUrl } : removeCover ? { coverImageUrl: null } : {}),
      },
    })
    if ((newPath || removeCover) && existing.coverImageUrl) {
      const oldPath = storagePath(existing.coverImageUrl)
      if (oldPath) {
        try {
          await deleteFromStorage(BUCKET, [oldPath])
        } catch (cleanupError) {
          console.error('Old news cover cleanup failed', cleanupError)
        }
      }
    }
    return Response.json(post, { status: 200 })
  } catch (error) {
    console.error('News update failed', error)
    if (newPath) {
      try {
        await deleteFromStorage(BUCKET, [newPath])
      } catch (cleanupError) {
        console.error('News cover rollback cleanup failed', cleanupError)
      }
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await prisma.newsPost.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'News post not found' }, { status: 404 })

  try {
    await prisma.newsPost.delete({ where: { id } })
    if (existing.coverImageUrl) {
      const path = storagePath(existing.coverImageUrl)
      if (path) {
        try {
          await deleteFromStorage(BUCKET, [path])
        } catch (cleanupError) {
          console.error('Deleted news cover cleanup failed', cleanupError)
        }
      }
    }
    return Response.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('News deletion failed', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
