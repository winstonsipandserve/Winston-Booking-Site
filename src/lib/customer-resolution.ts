import { Customer, Membership } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getMembershipActiveAt } from '@/lib/membership-current'

export interface ResolveCustomerInput {
  name: string
  phone: string
  email: string
}

export interface ResolveCustomerResult {
  customer: Customer
  isMember: boolean
}

/** The membership covering right now. Pass a slot start to `getMembershipActiveAt` when pricing a booking. */
export async function getActiveMembership(customerId: string): Promise<Membership | null> {
  return getMembershipActiveAt(customerId, new Date())
}

export async function isActiveMember(customerId: string): Promise<boolean> {
  return !!(await getActiveMembership(customerId))
}

export async function resolveCustomer(input: ResolveCustomerInput): Promise<ResolveCustomerResult> {
  const { name, phone, email } = input

  let customerRecord = await prisma.customer.findUnique({ where: { email } })
  if (!customerRecord) {
    customerRecord = await prisma.customer.create({ data: { name, email, phone } })
  }

  const isMember = await isActiveMember(customerRecord.id)

  return { customer: customerRecord, isMember }
}
