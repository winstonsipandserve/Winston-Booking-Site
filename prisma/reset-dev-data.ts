import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CONFIRM_FLAG = '--confirm'
const RESET_AUTHORIZATION = 'true'

const deletionLabels = [
  'auth rate-limit attempts',
  'admin password reset tokens',
  'check-in lookup attempts',
  'member activation tokens',
  'customer password reset tokens',
  'admin activity logs',
  'booking reschedules',
  'booking add-ons',
  'membership credit transactions',
  'payments',
  'membership payments',
  'memberships',
  'bookings',
  'membership applications',
  'bulletin-resource links',
  'bulletins',
  'customers',
] as const

type DeletionCounts = Record<(typeof deletionLabels)[number], number>

function isConfirmed() {
  return process.argv.slice(2).includes(CONFIRM_FLAG)
}

function assertSafeToRun(confirmed: boolean) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset data when NODE_ENV=production.')
  }

  if (confirmed && process.env.ALLOW_DEV_DATA_RESET !== RESET_AUTHORIZATION) {
    throw new Error(
      'Refusing to reset data. Set ALLOW_DEV_DATA_RESET=true and pass --confirm after reviewing the dry run.',
    )
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.')
  }
}

async function getCounts(client: PrismaClient): Promise<DeletionCounts> {
  const [
    authRateLimitAttempts,
    adminPasswordResetTokens,
    checkInLookupAttempts,
    memberActivationTokens,
    passwordResetTokens,
    adminActivityLogs,
    bookingReschedules,
    bookingAddOns,
    membershipCreditTransactions,
    payments,
    membershipPayments,
    memberships,
    bookings,
    membershipApplications,
    bulletinResources,
    bulletins,
    customers,
  ] = await Promise.all([
    client.authRateLimitAttempt.count(),
    client.adminPasswordResetToken.count(),
    client.checkInLookupAttempt.count(),
    client.memberActivationToken.count(),
    client.passwordResetToken.count(),
    client.adminActivityLog.count(),
    client.bookingReschedule.count(),
    client.bookingAddOn.count(),
    client.membershipCreditTransaction.count(),
    client.payment.count(),
    client.membershipPayment.count(),
    client.membership.count(),
    client.booking.count(),
    client.membershipApplication.count(),
    client.bulletinResource.count(),
    client.bulletin.count(),
    client.customer.count(),
  ])

  return {
    'auth rate-limit attempts': authRateLimitAttempts,
    'admin password reset tokens': adminPasswordResetTokens,
    'check-in lookup attempts': checkInLookupAttempts,
    'member activation tokens': memberActivationTokens,
    'customer password reset tokens': passwordResetTokens,
    'admin activity logs': adminActivityLogs,
    'booking reschedules': bookingReschedules,
    'booking add-ons': bookingAddOns,
    'membership credit transactions': membershipCreditTransactions,
    payments,
    'membership payments': membershipPayments,
    memberships,
    bookings,
    'membership applications': membershipApplications,
    'bulletin-resource links': bulletinResources,
    bulletins,
    customers,
  }
}

function printCounts(counts: DeletionCounts, heading: string) {
  console.log(heading)
  for (const label of deletionLabels) {
    console.log(`  ${label}: ${counts[label]}`)
  }
}

async function deleteDevelopmentData() {
  return prisma.$transaction(async (tx) => {
    const counts: DeletionCounts = {
      'auth rate-limit attempts': (await tx.authRateLimitAttempt.deleteMany()).count,
      'admin password reset tokens': (await tx.adminPasswordResetToken.deleteMany()).count,
      'check-in lookup attempts': (await tx.checkInLookupAttempt.deleteMany()).count,
      'member activation tokens': (await tx.memberActivationToken.deleteMany()).count,
      'customer password reset tokens': (await tx.passwordResetToken.deleteMany()).count,
      'admin activity logs': (await tx.adminActivityLog.deleteMany()).count,
      'booking reschedules': (await tx.bookingReschedule.deleteMany()).count,
      'booking add-ons': (await tx.bookingAddOn.deleteMany()).count,
      'membership credit transactions': (await tx.membershipCreditTransaction.deleteMany()).count,
      payments: (await tx.payment.deleteMany()).count,
      'membership payments': (await tx.membershipPayment.deleteMany()).count,
      memberships: (await tx.membership.deleteMany()).count,
      bookings: (await tx.booking.deleteMany()).count,
      'membership applications': (await tx.membershipApplication.deleteMany()).count,
      'bulletin-resource links': (await tx.bulletinResource.deleteMany()).count,
      bulletins: (await tx.bulletin.deleteMany()).count,
      customers: (await tx.customer.deleteMany()).count,
    }

    return counts
  }, {
    maxWait: 10_000,
    timeout: 30_000,
  })
}

async function main() {
  const confirmed = isConfirmed()
  assertSafeToRun(confirmed)

  const counts = await getCounts(prisma)
  printCounts(counts, 'Development data reset preview:')

  if (!confirmed) {
    console.log('\nDry run only. No data was deleted. Pass --confirm to apply this reset.')
    return
  }

  const deletedCounts = await deleteDevelopmentData()
  printCounts(deletedCounts, '\nDeleted:')
  console.log('\nPreserved: admin users, resources, resource types, pricing, guest fee, and add-on catalog data.')
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
