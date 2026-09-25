import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getMembershipDisplayStatus, type MembershipDisplayStatus } from '@/lib/membership-display-status'

const VALID_STATUS_FILTER_VALUES = new Set([
  'all',
  'pending',
  'awaiting_payment',
  'active',
  'expired',
  'rejected',
])

export function isMembershipDisplayStatusFilter(value: string): value is MembershipDisplayStatus | 'all' {
  return VALID_STATUS_FILTER_VALUES.has(value)
}

export function buildMembershipSearchWhere(search?: string): Prisma.MembershipApplicationWhereInput {
  const trimmedSearch = search?.trim()
  if (!trimmedSearch) return {}
  return {
    OR: [
      { customer: { name: { contains: trimmedSearch, mode: 'insensitive' } } },
      { customer: { email: { contains: trimmedSearch, mode: 'insensitive' } } },
      { customer: { phone: { contains: trimmedSearch, mode: 'insensitive' } } },
    ],
  }
}

export type ApplicationWithRelations = Prisma.MembershipApplicationGetPayload<{
  include: {
    customer: { include: { memberships: true } }
    reviewedBy: true
  }
}>

export async function getMembershipApplicationsForFilter(
  filter: MembershipDisplayStatus | 'all',
  options?: { pagination?: { skip: number; take: number }; search?: string },
): Promise<{
  applications: ApplicationWithRelations[]
  totalCount: number
  latestMembershipsByCustomer: Map<string, { endDate: Date }>
}> {
  let applications: ApplicationWithRelations[]
  let totalCount: number
  let latestMembershipsByCustomer: Map<string, { endDate: Date }>

  const pagination = options?.pagination
  const searchWhere = buildMembershipSearchWhere(options?.search)

  if (filter === 'all' || filter === 'pending' || filter === 'rejected') {
    const where: Prisma.MembershipApplicationWhereInput = { ...searchWhere }
    if (filter !== 'all') {
      where.status = filter
    }

    const [dbApplications, dbTotalCount] = await Promise.all([
      prisma.membershipApplication.findMany({
        where,
        include: {
          customer: {
            include: {
              memberships: {
                orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }, { id: 'asc' }],
                take: 1,
              },
            },
          },
          reviewedBy: true,
        },
        orderBy: { createdAt: 'desc' },
        ...(pagination ? { skip: pagination.skip, take: pagination.take } : {}),
        relationLoadStrategy: 'join',
      }),
      prisma.membershipApplication.count({ where }),
    ])
    applications = dbApplications
    totalCount = dbTotalCount

    latestMembershipsByCustomer = new Map(
      dbApplications
        .filter((application) => application.customer.memberships.length > 0)
        .map((application) => [
          application.customerId,
          { endDate: application.customer.memberships[0].endDate },
        ]),
    )
  } else {
    const approvedApplications = await prisma.membershipApplication.findMany({
      where: { status: 'approved', ...searchWhere },
      include: {
        customer: {
          include: {
            memberships: {
              orderBy: [{ endDate: 'desc' }, { startDate: 'desc' }, { id: 'asc' }],
              take: 1,
            },
          },
        },
        reviewedBy: true,
      },
      orderBy: { createdAt: 'desc' },
      relationLoadStrategy: 'join',
    })

    latestMembershipsByCustomer = new Map(
      approvedApplications
        .filter((application) => application.customer.memberships.length > 0)
        .map((application) => [
          application.customerId,
          { endDate: application.customer.memberships[0].endDate },
        ]),
    )

    const filteredApplications = approvedApplications.filter((application) => {
      const displayStatus = getMembershipDisplayStatus({
        status: application.status,
        latestMembership: latestMembershipsByCustomer.get(application.customerId) ?? null,
      })
      return displayStatus === filter
    })

    totalCount = filteredApplications.length
    applications = pagination
      ? filteredApplications.slice(pagination.skip, pagination.skip + pagination.take)
      : filteredApplications
  }

  return { applications, totalCount, latestMembershipsByCustomer }
}
