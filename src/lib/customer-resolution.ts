import { Customer } from '@prisma/client'
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

export async function isActiveMember(customerId: string): Promise<boolean> {
  const now = new Date()
  const activeMembership = await prisma.membership.findFirst({
    where: { customerId, status: 'active', endDate: { gte: now } },
  })
  return !!activeMembership
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
