import { Customer, Membership } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface ResolveCustomerInput {
  name: string
  phone: string
  email: string
}

export interface ResolveCustomerResult {
  customer: Customer
  isMember: boolean
}

export async function getActiveMembership(customerId: string): Promise<Membership | null> {
  const now = new Date()
  return prisma.membership.findFirst({
    where: { customerId, status: 'active', endDate: { gte: now } },
  })
}

export async function isActiveMember(customerId: string): Promise<boolean> {
  return !!(await getActiveMembership(customerId))
}

export async function resolveCustomer(
  input: ResolveCustomerInput,
): Promise<ResolveCustomerResult> {
  const { name, phone, email } = input

  let customerRecord = await prisma.customer.findUnique({ where: { email } })
  if (customerRecord) {
    if (customerRecord.name !== name || customerRecord.phone !== phone) {
      customerRecord = await prisma.customer.update({
        where: { id: customerRecord.id },
        data: { name, phone },
      })
    }
  } else {
    customerRecord = await prisma.customer.create({ data: { name, email, phone } })
  }

  const isMember = await isActiveMember(customerRecord.id)

  return { customer: customerRecord, isMember }
}
