import { randomBytes } from 'crypto'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

export function generateCheckInToken(): string {
  return randomBytes(24).toString('base64url')
}

export async function getOrCreateCheckInToken(customerId: string): Promise<string> {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })
  if (customer.checkInToken) {
    return customer.checkInToken
  }

  const token = generateCheckInToken()
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { checkInToken: token },
  })
  return updated.checkInToken as string
}

export async function regenerateCheckInToken(customerId: string): Promise<string> {
  const token = generateCheckInToken()
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { checkInToken: token },
  })
  return updated.checkInToken as string
}

export async function generateQrCodeDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 320, margin: 1 })
}
