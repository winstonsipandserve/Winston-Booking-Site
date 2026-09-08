import { Prisma, AdminActivityAction, AdminActivityEntityType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type PrismaTransactionClient = Prisma.TransactionClient

interface LogAdminActivityParams {
  adminId: string
  action: AdminActivityAction
  entityType: AdminActivityEntityType
  entityId: string
  description: string
  metadata?: Prisma.InputJsonValue
}

export async function logAdminActivity(
  { adminId, action, entityType, entityId, description, metadata }: LogAdminActivityParams,
  client: PrismaTransactionClient | typeof prisma = prisma,
) {
  return client.adminActivityLog.create({
    data: { adminId, action, entityType, entityId, description, metadata },
  })
}
