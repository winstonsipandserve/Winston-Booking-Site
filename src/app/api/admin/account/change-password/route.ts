import { getActiveAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/admin-auth'

interface ChangePasswordRequestBody {
  currentPassword?: unknown
  newPassword?: unknown
  confirmNewPassword?: unknown
}

export async function POST(request: Request) {
  const activeSession = await getActiveAdminSession()
  if (!activeSession) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ChangePasswordRequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Malformed JSON body' }, { status: 400 })
  }

  const { currentPassword, newPassword, confirmNewPassword } = body
  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmNewPassword !== 'string' ||
    currentPassword.length === 0 ||
    newPassword.length === 0 ||
    confirmNewPassword.length === 0
  ) {
    return Response.json({ error: 'All fields are required' }, { status: 400 })
  }

  const adminUser = await prisma.adminUser.findUnique({ where: { id: activeSession.adminUser.id } })
  if (!adminUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isValid = await verifyPassword(currentPassword, adminUser.passwordHash)
  if (!isValid) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }
  if (newPassword !== confirmNewPassword) {
    return Response.json({ error: 'New passwords do not match' }, { status: 400 })
  }

  const passwordHash = await hashPassword(newPassword)
  await prisma.adminUser.update({
    where: { id: adminUser.id },
    data: { passwordHash },
  })

  return Response.json({ success: true }, { status: 200 })
}
