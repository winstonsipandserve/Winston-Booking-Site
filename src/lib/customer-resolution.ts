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

export interface ResolveCustomerOptions {
  /**
   * Whether a mismatched name/phone may update an existing row that has no login yet.
   * Only the membership-application flow passes true — the applicant is describing
   * themselves. The anonymous booking flow passes false: anyone can type any email there,
   * and the booking already snapshots what was submitted, so the shared row must not be
   * rewritable by a stranger (docs/decisions.md → Customer records are never blind-inserted).
   */
  updateExistingProfile: boolean
}

export async function resolveCustomer(
  input: ResolveCustomerInput,
  options: ResolveCustomerOptions,
): Promise<ResolveCustomerResult> {
  const { name, phone, email } = input

  let customerRecord = await prisma.customer.findUnique({ where: { email } })
  if (customerRecord) {
    // Once a Customer has a real login account (passwordHash set via member activation),
    // name/phone are frozen regardless of the caller.
    if (
      options.updateExistingProfile &&
      !customerRecord.passwordHash &&
      (customerRecord.name !== name || customerRecord.phone !== phone)
    ) {
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
