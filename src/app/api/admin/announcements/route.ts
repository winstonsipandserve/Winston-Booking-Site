import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { parseAnnouncementForm } from '@/lib/announcement-validation'
import {
  announcementIsClaimingResources,
  applyAnnouncementResourceDisable,
} from '@/lib/announcement-resource-disable'

export async function POST(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Malformed form data' }, { status: 400 })
  }

  const parsed = parseAnnouncementForm(formData)
  if ('error' in parsed) return Response.json({ error: parsed.error }, { status: 400 })
  const { resourceIds, ...fields } = parsed.fields

  if (resourceIds.length > 0) {
    const count = await prisma.resource.count({ where: { id: { in: resourceIds } } })
    if (count !== resourceIds.length) {
      return Response.json({ error: 'One or more selected resources do not exist' }, { status: 400 })
    }
  }

  try {
    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: { ...fields, createdById: activeSession.adminUser.id },
      })
      if (resourceIds.length > 0) {
        await tx.announcementResource.createMany({
          data: resourceIds.map((resourceId) => ({ announcementId: created.id, resourceId })),
        })
      }
      if (announcementIsClaimingResources(created)) {
        await applyAnnouncementResourceDisable(tx, resourceIds)
      }
      return created
    })
    return Response.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Announcement creation failed', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
