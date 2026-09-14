import { prisma } from '@/lib/prisma'
import { generatePaymentLinkToken } from '@/lib/membership-payment-link'

async function main() {
  const membershipPaymentId = 'cmu1kzf4t0001w4iwlzre3b33'

  const { rawToken, tokenHash, expiresAt } = generatePaymentLinkToken()

  await prisma.$transaction(async (tx) => {
    const now = new Date()
    await tx.membershipPaymentLinkToken.updateMany({
      where: { membershipPaymentId, usedAt: null },
      data: { usedAt: now },
    })
    await tx.membershipPaymentLinkToken.create({
      data: { membershipPaymentId, tokenHash, expiresAt },
    })
  })

  console.log(`http://localhost:3000/membership/renew/${membershipPaymentId}?token=${rawToken}`)
  await prisma.$disconnect()
}

main()
