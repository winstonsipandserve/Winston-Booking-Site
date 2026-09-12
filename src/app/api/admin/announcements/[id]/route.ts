import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { parseAnnouncementForm } from '@/lib/announcement-validation'
import {
  announcementIsClaimingResources,
  applyAnnouncementResourceDisable,
  releaseAnnouncementResourceDisable,
} from '@/lib/announcement-resource-disable'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'Announcement not found' }, { status: 404 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Malformed form data' }, { status: 400 })
  }
  const parsed = parseAnnouncementForm(formData)
  if ('error' in parsed) return Response.json({ error: parsed.error }, { status: 400 })
  const { resourceIds: newResourceIds, ...fields } = parsed.fields

  if (newResourceIds.length > 0) {
    const count = await prisma.resource.count({ where: { id: { in: newResourceIds } } })
    if (count !== newResourceIds.length) {
      return Response.json({ error: 'One or more selected resources do not exist' }, { status: 400 })
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const links = await tx.announcementResource.findMany({
        where: { announcementId: id },
        select: { resourceId: true },
      })
      const oldResourceIds = links.map((link) => link.resourceId)
      const oldSet = new Set(oldResourceIds)
      const newSet = new Set(newResourceIds)
      const oldClaim = announcementIsClaimingResources(existing)
      const newClaim = announcementIsClaimingResources(fields)
      const toApply: string[] = []
      const toRelease: string[] = []

      for (const resourceId of new Set([...oldResourceIds, ...newResourceIds])) {
        const wasClaimed = oldSet.has(resourceId) && oldClaim
        const willBeClaimed = newSet.has(resourceId) && newClaim
        if (!wasClaimed && willBeClaimed) toApply.push(resourceId)
        if (wasClaimed && !willBeClaimed) toRelease.push(resourceId)
      }

      const announcement = await tx.announcement.update({ where: { id }, data: fields })
      await tx.announcementResource.deleteMany({
        where: { announcementId: id, resourceId: { notIn: newResourceIds } },
      })
      const toCreate = newResourceIds.filter((resourceId) => !oldSet.has(resourceId))
      if (toCreate.length > 0) {
        await tx.announcementResource.createMany({
          data: toCreate.map((resourceId) => ({ announcementId: id, resourceId })),
        })
      }
      await applyAnnouncementResourceDisable(tx, toApply)
      await releaseAnnouncementResourceDisable(tx, toRelease, id)
      return announcement
    })
    return Response.json(updated, { status: 200 })
  } catch (error) {
    console.error('Announcement update failed', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'Announcement not found' }, { status: 404 })

  try {
    await prisma.$transaction(async (tx) => {
      const links = await tx.announcementResource.findMany({
        where: { announcementId: id },
        select: { resourceId: true },
      })
      await releaseAnnouncementResourceDisable(tx, links.map((link) => link.resourceId), id)
      await tx.announcement.delete({ where: { id } })
    })
    return Response.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Announcement deletion failed', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
