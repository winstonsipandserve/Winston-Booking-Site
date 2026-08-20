import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = `test.verify.applicant.${Date.now()}@example.com`

  const customer = await prisma.customer.create({
    data: {
      name: 'TEST Verify Applicant',
      email,
      phone: '09171234567',
    },
  })

  const application = await prisma.membershipApplication.create({
    data: {
      customerId: customer.id,
      requestedTier: 'three_month',
      status: 'pending',
      address: '123 Test Street, Quezon City, Metro Manila',
      contactNumber: '09171234567',
      govIdFrontUrl: 'https://placeholder.example.com/gov-id-front.jpg',
      govIdBackUrl: 'https://placeholder.example.com/gov-id-back.jpg',
      govIdSelfieUrl: 'https://placeholder.example.com/gov-id-selfie.jpg',
    },
  })

  console.log('Created MembershipApplication id:', application.id)
  console.log('Customer id:', customer.id)
  console.log('Customer email:', customer.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
