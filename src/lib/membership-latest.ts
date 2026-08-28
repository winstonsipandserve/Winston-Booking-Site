import { prisma } from '@/lib/prisma'

export async function getLatestMembershipsByCustomerIds(
  customerIds: string[],
): Promise<Map<string, { endDate: Date }>> {
  const memberships = await prisma.membership.findMany({
    where: { customerId: { in: customerIds } },
    orderBy: { startDate: 'desc' },
  })

  const latestByCustomerId = new Map<string, { endDate: Date }>()
  for (const membership of memberships) {
    if (!latestByCustomerId.has(membership.customerId)) {
      latestByCustomerId.set(membership.customerId, { endDate: membership.endDate })
    }
  }
  return latestByCustomerId
}

export async function getLatestMembershipByCustomerId(
  customerId: string,
): Promise<{ endDate: Date } | null> {
  const latestByCustomerId = await getLatestMembershipsByCustomerIds([customerId])
  return latestByCustomerId.get(customerId) ?? null
}
