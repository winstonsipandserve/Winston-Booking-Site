import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { uploadToStorage, deleteFromStorage, getPublicUrl } from '@/lib/supabase-storage'
import {
  MIME_TO_EXTENSION,
  BULLETIN_CATEGORY_RULES,
  parseCommonFields,
  parseResourceFields,
  validateImageFile,
} from '@/lib/bulletin-validation'
import { applyBulletinResourceDisable, bulletinShouldDisableResources } from '@/lib/bulletin-resource-disable'

const BUCKET = 'bulletin-images'

export async function POST(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
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

  const resourceParsed = parseResourceFields(formData)
  if ('error' in resourceParsed) {
    return Response.json({ error: resourceParsed.error }, { status: 400 })
  }

  const { fields } = parsed
  const { resourceIds, autoDisableResources } = resourceParsed.fields

  if (resourceIds.length > 0) {
    const matchCount = await prisma.resource.count({ where: { id: { in: resourceIds } } })
    if (matchCount !== resourceIds.length) {
      return Response.json({ error: 'One or more selected resources do not exist' }, { status: 400 })
    }
  }

  const imageValue = formData.get('image')
  const hasImageFile = imageValue instanceof File && imageValue.size > 0

  if (BULLETIN_CATEGORY_RULES[fields.category].requireImage && !hasImageFile) {
    return Response.json({ error: 'Image is required for this category' }, { status: 400 })
  }

  const bulletinId = crypto.randomUUID()
  let imagePath: string | null = null
  let imageUrl: string | null = null

  if (hasImageFile) {
    const imageResult = await validateImageFile(imageValue as File)
    if ('error' in imageResult) {
      return Response.json({ error: imageResult.error }, { status: 400 })
    }

    imagePath = `${bulletinId}/image.${MIME_TO_EXTENSION[imageResult.file.type]}`

    try {
      await uploadToStorage(BUCKET, imagePath, imageResult.file)
    } catch (err) {
      console.error('Bulletin image upload failed', err)
      return Response.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    imageUrl = getPublicUrl(BUCKET, imagePath)
  }

  try {
    const bulletin = await prisma.$transaction(async (tx) => {
      const created = await tx.bulletin.create({
        data: {
          id: bulletinId,
          title: fields.title,
          excerpt: fields.excerpt,
          body: fields.body,
          category: fields.category,
          imageUrl,
          socialPlatform: fields.socialPlatform,
          socialUrl: fields.socialUrl,
          affectedFacility: fields.affectedFacility,
          impact: fields.impact,
          action: fields.action,
          bookingImpact: fields.bookingImpact,
          customerActionType: fields.customerActionType,
          promoCode: fields.promoCode,
          discountSummary: fields.discountSummary,
          customerEligibility: fields.customerEligibility,
          eventStartAt: fields.eventStartAt,
          eventEndAt: fields.eventEndAt,
          expiresAt: fields.expiresAt,
          ctaLabel: fields.ctaLabel,
          ctaUrl: fields.ctaUrl,
          isPublished: fields.isPublished,
          publishedAt: fields.isPublished ? new Date() : null,
          autoDisableResources,
        },
      })

      if (resourceIds.length > 0) {
        await tx.bulletinResource.createMany({
          data: resourceIds.map((resourceId) => ({ bulletinId: created.id, resourceId })),
        })
      }

      if (bulletinShouldDisableResources(created) && resourceIds.length > 0) {
        await applyBulletinResourceDisable(tx, resourceIds)
      }

      return created
    })

    return Response.json(bulletin, { status: 201 })
  } catch (err) {
    console.error('Bulletin creation failed', err)
    if (imagePath) {
      await deleteFromStorage(BUCKET, [imagePath])
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
