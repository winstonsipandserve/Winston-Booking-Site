import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createUniqueNewsSlug, slugBase } from '@/lib/news'
import { parseNewsForm } from '@/lib/news-validation'
import { MIME_TO_EXTENSION, validateImageFile } from '@/lib/content-image-validation'
import { deleteFromStorage, getPublicUrl, uploadToStorage } from '@/lib/supabase-storage'

const BUCKET = 'bulletin-images'

export async function POST(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Malformed form data' }, { status: 400 })
  }
  const parsed = parseNewsForm(formData)
  if ('error' in parsed) return Response.json({ error: parsed.error }, { status: 400 })

  const image = formData.get('coverImage')
  const hasImage = image instanceof File && image.size > 0
  if (parsed.fields.status === 'published' && !hasImage) {
    return Response.json({ error: 'A cover image is required before publishing' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  let imagePath: string | null = null
  let coverImageUrl: string | null = null
  if (hasImage) {
    const validated = await validateImageFile(image)
    if ('error' in validated) return Response.json({ error: validated.error }, { status: 400 })
    imagePath = `news/${id}/cover.${MIME_TO_EXTENSION[validated.file.type]}`
    try {
      await uploadToStorage(BUCKET, imagePath, validated.file)
      coverImageUrl = getPublicUrl(BUCKET, imagePath)
    } catch (error) {
      console.error('News cover upload failed', error)
      return Response.json({ error: 'Failed to upload cover image' }, { status: 500 })
    }
  }

  try {
    const slug = await createUniqueNewsSlug(parsed.fields.title, async (candidate) =>
      Boolean(await prisma.newsPost.findUnique({ where: { slug: candidate }, select: { id: true } })),
    )
    try {
      const post = await prisma.newsPost.create({
        data: { id, slug, ...parsed.fields, coverImageUrl, createdById: activeSession.adminUser.id },
      })
      return Response.json(post, { status: 201 })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error

      // A concurrent create can win after the existence check. The generated id makes
      // this retry collision-safe without ever changing the slug after creation.
      const retrySlug = `${slugBase(parsed.fields.title)}-${id.slice(0, 8)}`
      const post = await prisma.newsPost.create({
        data: { id, slug: retrySlug, ...parsed.fields, coverImageUrl, createdById: activeSession.adminUser.id },
      })
      return Response.json(post, { status: 201 })
    }
  } catch (error) {
    console.error('News creation failed', error)
    if (imagePath) {
      try {
        await deleteFromStorage(BUCKET, [imagePath])
      } catch (cleanupError) {
        console.error('News cover cleanup failed', cleanupError)
      }
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
