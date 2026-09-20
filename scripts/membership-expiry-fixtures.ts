import { Prisma, PrismaClient } from '@prisma/client'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { hashPassword } from '../src/lib/admin-auth'
import { MEMBERSHIP_TIER_PLANS } from '../src/lib/membership-pricing'
import { deleteFromStorage, uploadToStorage } from '../src/lib/supabase-storage'

const prisma = new PrismaClient()
const AUTHORIZATION_VALUE = 'true'
const FIXTURE_PASSWORD = 'MembershipExpiry!2026'
const MANIFEST_VERSION = 1
const STORAGE_BUCKET = 'membership-applications'
const PLACEHOLDER_STORAGE_PATH = 'fixtures/membership-expiry-placeholder.png'
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3MxZ5wAAAABJRU5ErkJggg=='
const manifestPath = fileURLToPath(new URL('./.membership-fixtures.json', import.meta.url))
const plan = MEMBERSHIP_TIER_PLANS.player
// Fixtures carry a small top-up so credit-redemption paths stay exercisable (no credit is
// granted with a plan any more).
const FIXTURE_TOP_UP_CENTAVOS = 100_000

const fixtureDefinitions = [
  { slug: 'exp10d', endOffsetMs: 10 * 24 * 60 * 60 * 1000 },
  { slug: 'exp2d', endOffsetMs: 2 * 24 * 60 * 60 * 1000 },
  { slug: 'exp1h', endOffsetMs: 60 * 60 * 1000 },
  { slug: 'expm1h', endOffsetMs: -60 * 60 * 1000 },
  { slug: 'expm20d', endOffsetMs: -20 * 24 * 60 * 60 * 1000 },
] as const

const fixtureEmails = [
  ...fixtureDefinitions.map(({ slug }) => `arjayrafaelical+${slug}@gmail.com`),
  'arjayrafaelical+renewed@gmail.com',
]

interface FixtureManifest {
  version: number
  createdAt: string
  databaseHost: string
  customerIds: string[]
  applicationIds: string[]
  membershipPaymentIds: string[]
  membershipIds: string[]
  creditTransactionIds: string[]
}

interface CreatedIds {
  customerId: string
  applicationId: string
  membershipPaymentIds: string[]
  membershipIds: string[]
  creditTransactionIds: string[]
}

function assertSafeToRun(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to manage membership fixtures when NODE_ENV=production.')
  }
  if (process.env.ALLOW_DEV_DATA_RESET !== AUTHORIZATION_VALUE) {
    throw new Error(
      'Refusing to manage membership fixtures. Set ALLOW_DEV_DATA_RESET=true after verifying the configured database is isolated development data.',
    )
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.')
  }

  let databaseHost: string
  try {
    databaseHost = new URL(process.env.DATABASE_URL).hostname
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.')
  }
  console.log(`Database host: ${databaseHost}`)
  return databaseHost
}

function subtractUtcMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setUTCMonth(result.getUTCMonth() - months)
  return result
}

function fixtureName(slug: string): string {
  return `Membership Expiry ${slug}`
}

async function createFixture(
  tx: Prisma.TransactionClient,
  slug: string,
  endDate: Date,
  passwordHash: string,
  options: { renewed?: boolean } = {},
): Promise<CreatedIds> {
  const email = `arjayrafaelical+${slug}@gmail.com`
  const customer = await tx.customer.create({
    data: {
      name: fixtureName(slug),
      email,
      phone: '+639170000000',
      passwordHash,
    },
  })

  const application = await tx.membershipApplication.create({
    data: {
      customerId: customer.id,
      requestedTier: 'player',
      status: 'approved',
      address: 'Membership expiry fixture — development only',
      contactNumber: customer.phone,
      govIdFrontUrl: PLACEHOLDER_STORAGE_PATH,
      govIdBackUrl: PLACEHOLDER_STORAGE_PATH,
      govIdSelfieUrl: PLACEHOLDER_STORAGE_PATH,
      reviewedAt: new Date(),
    },
  })

  const startDate = subtractUtcMonths(endDate, plan.months)
  const activationPayment = await tx.membershipPayment.create({
    data: {
      applicationId: application.id,
      customerId: customer.id,
      tier: 'player',
      amountCentavos: plan.totalCentavos,
      status: 'paid',
      paidAt: startDate,
    },
  })
  const membership = await tx.membership.create({
    data: {
      customerId: customer.id,
      applicationId: application.id,
      tier: 'player',
      startDate,
      endDate,
      creditBalanceCentavos: FIXTURE_TOP_UP_CENTAVOS,
    },
  })
  const activationCredit = await tx.membershipCreditTransaction.create({
    data: {
      membershipId: membership.id,
      amountCentavos: FIXTURE_TOP_UP_CENTAVOS,
      reason: 'top_up',
    },
  })

  const result: CreatedIds = {
    customerId: customer.id,
    applicationId: application.id,
    membershipPaymentIds: [activationPayment.id],
    membershipIds: [membership.id],
    creditTransactionIds: [activationCredit.id],
  }

  if (options.renewed) {
    const renewedEndDate = new Date(Date.now() + 85 * 24 * 60 * 60 * 1000)
    const renewedStartDate = subtractUtcMonths(renewedEndDate, plan.months)
    const renewalPayment = await tx.membershipPayment.create({
      data: {
        applicationId: null,
        customerId: customer.id,
        tier: 'player',
        amountCentavos: plan.totalCentavos,
        status: 'paid',
        paidAt: renewedStartDate,
      },
    })
    const renewedMembership = await tx.membership.create({
      data: {
        customerId: customer.id,
        applicationId: null,
        tier: 'player',
        startDate: renewedStartDate,
        endDate: renewedEndDate,
        creditBalanceCentavos: FIXTURE_TOP_UP_CENTAVOS,
      },
    })
    const renewalCredit = await tx.membershipCreditTransaction.create({
      data: {
        membershipId: renewedMembership.id,
        amountCentavos: FIXTURE_TOP_UP_CENTAVOS,
        reason: 'top_up',
      },
    })
    result.membershipPaymentIds.push(renewalPayment.id)
    result.membershipIds.push(renewedMembership.id)
    result.creditTransactionIds.push(renewalCredit.id)
  }

  return result
}

async function createFixtures(databaseHost: string) {
  try {
    await readFile(manifestPath, 'utf8')
    throw new Error(
      `Fixture manifest already exists at ${manifestPath}. Run "npm run db:membership-fixtures -- cleanup" first.`,
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  const existingCustomers = await prisma.customer.findMany({
    where: { email: { in: fixtureEmails } },
    select: { email: true },
  })
  if (existingCustomers.length > 0) {
    throw new Error(
      `Fixture customers already exist (${existingCustomers.map(({ email }) => email).join(', ')}). Run "npm run db:membership-fixtures -- cleanup" first.`,
    )
  }

  const passwordHash = await hashPassword(FIXTURE_PASSWORD)
  const createdAt = new Date()
  const placeholderFile = new File(
    [Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64')],
    'membership-expiry-placeholder.png',
    { type: 'image/png' },
  )
  await uploadToStorage(STORAGE_BUCKET, PLACEHOLDER_STORAGE_PATH, placeholderFile)

  let created: CreatedIds[]
  try {
    created = await prisma.$transaction(async (tx) => {
      const fixtures: CreatedIds[] = []
      for (const definition of fixtureDefinitions) {
        fixtures.push(
          await createFixture(
            tx,
            definition.slug,
            new Date(createdAt.getTime() + definition.endOffsetMs),
            passwordHash,
          ),
        )
      }
      fixtures.push(
        await createFixture(
          tx,
          'renewed',
          new Date(createdAt.getTime() - 5 * 24 * 60 * 60 * 1000),
          passwordHash,
          { renewed: true },
        ),
      )
      return fixtures
    }, { maxWait: 10_000, timeout: 30_000 })
  } catch (error) {
    await deleteFromStorage(STORAGE_BUCKET, [PLACEHOLDER_STORAGE_PATH])
    throw error
  }

  const manifest: FixtureManifest = {
    version: MANIFEST_VERSION,
    createdAt: createdAt.toISOString(),
    databaseHost,
    customerIds: created.map(({ customerId }) => customerId),
    applicationIds: created.map(({ applicationId }) => applicationId),
    membershipPaymentIds: created.flatMap(({ membershipPaymentIds }) => membershipPaymentIds),
    membershipIds: created.flatMap(({ membershipIds }) => membershipIds),
    creditTransactionIds: created.flatMap(({ creditTransactionIds }) => creditTransactionIds),
  }
  try {
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  } catch (error) {
    await deleteFixtureRows(manifest)
    await deleteFromStorage(STORAGE_BUCKET, [PLACEHOLDER_STORAGE_PATH])
    throw new Error('Could not write the fixture manifest; the newly created fixture rows were removed.', {
      cause: error,
    })
  }

  console.log(`Created ${manifest.customerIds.length} customers and ${manifest.membershipIds.length} memberships.`)
  console.log(`Fixture password: ${FIXTURE_PASSWORD}`)
  console.log(`Manifest: ${manifestPath}`)
}

async function readManifest(databaseHost: string): Promise<FixtureManifest> {
  let manifest: FixtureManifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as FixtureManifest
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Fixture manifest not found at ${manifestPath}. Nothing was cleaned up.`)
    }
    throw error
  }
  if (manifest.version !== MANIFEST_VERSION) {
    throw new Error(`Unsupported fixture manifest version ${manifest.version}. Nothing was cleaned up.`)
  }
  if (manifest.databaseHost !== databaseHost) {
    throw new Error(
      `Fixture manifest belongs to database host ${manifest.databaseHost}, not ${databaseHost}. Nothing was cleaned up.`,
    )
  }
  return manifest
}

async function deleteFixtureRows(manifest: FixtureManifest) {
  const customerIds = manifest.customerIds

  return prisma.$transaction(async (tx) => {
    const bookings = await tx.booking.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    })
    const bookingIds = bookings.map(({ id }) => id)
    const memberships = await tx.membership.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    })
    const membershipIds = memberships.map(({ id }) => id)

    await tx.bookingReschedule.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await tx.bookingAddOn.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await tx.membershipCreditTransaction.deleteMany({
      where: {
        OR: [
          { membershipId: { in: membershipIds } },
          { bookingId: { in: bookingIds } },
        ],
      },
    })
    await tx.payment.deleteMany({
      where: {
        OR: [
          { membershipId: { in: membershipIds } },
          { bookingId: { in: bookingIds } },
        ],
      },
    })
    await tx.booking.deleteMany({ where: { id: { in: bookingIds } } })
    await tx.memberActivationToken.deleteMany({ where: { customerId: { in: customerIds } } })
    await tx.passwordResetToken.deleteMany({ where: { customerId: { in: customerIds } } })
    await tx.membershipPayment.deleteMany({ where: { customerId: { in: customerIds } } })
    await tx.membership.deleteMany({ where: { id: { in: membershipIds } } })
    await tx.adminActivityLog.deleteMany({
      where: {
        entityType: 'membership_application',
        entityId: { in: manifest.applicationIds },
      },
    })
    await tx.membershipApplication.deleteMany({ where: { customerId: { in: customerIds } } })
    const customers = await tx.customer.deleteMany({ where: { id: { in: customerIds } } })

    return { customers: customers.count, memberships: membershipIds.length, bookings: bookingIds.length }
  }, { maxWait: 10_000, timeout: 30_000 })
}

async function cleanupFixtures(databaseHost: string) {
  const manifest = await readManifest(databaseHost)
  const deleted = await deleteFixtureRows(manifest)

  await unlink(manifestPath)
  await deleteFromStorage(STORAGE_BUCKET, [PLACEHOLDER_STORAGE_PATH])
  console.log(
    `Deleted fixture-owned data for ${deleted.customers} customers, ${deleted.memberships} memberships, and ${deleted.bookings} bookings.`,
  )
  console.log('Removed the fixture manifest.')
}

async function main() {
  const command = process.argv[2]
  if (command !== 'create' && command !== 'cleanup') {
    throw new Error('Usage: npm run db:membership-fixtures -- <create|cleanup>')
  }
  const databaseHost = assertSafeToRun()
  if (command === 'create') {
    await createFixtures(databaseHost)
  } else {
    await cleanupFixtures(databaseHost)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
