import { randomBytes, randomInt } from 'crypto'
import { Prisma } from '@prisma/client'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

const MAX_CODE_GENERATION_ATTEMPTS = 10

export function generateCheckInToken(): string {
  return randomBytes(24).toString('base64url')
}

export function generateCheckInCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function isUniqueCheckInCodeViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    (err.meta?.target as string[] | undefined)?.includes('check_in_code') === true
  )
}

export interface CheckInCredentials {
  token: string
  code: string
}

export async function getOrCreateCheckInToken(customerId: string): Promise<CheckInCredentials> {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })

  if (customer.checkInToken && customer.checkInCode) {
    return { token: customer.checkInToken, code: customer.checkInCode }
  }

  if (customer.checkInToken && !customer.checkInCode) {
    const code = await backfillCheckInCode(customerId)
    return { token: customer.checkInToken, code }
  }

  const token = generateCheckInToken()
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = generateCheckInCode()
    try {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { checkInToken: token, checkInCode: code },
      })
      return { token: updated.checkInToken as string, code: updated.checkInCode as string }
    } catch (err) {
      if (isUniqueCheckInCodeViolation(err)) continue
      throw err
    }
  }
  throw new Error('Could not generate a unique check-in code')
}

async function backfillCheckInCode(customerId: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = generateCheckInCode()
    try {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { checkInCode: code },
      })
      return updated.checkInCode as string
    } catch (err) {
      if (isUniqueCheckInCodeViolation(err)) continue
      throw err
    }
  }
  throw new Error('Could not generate a unique check-in code')
}

export async function regenerateCheckInToken(customerId: string): Promise<CheckInCredentials> {
  const token = generateCheckInToken()
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = generateCheckInCode()
    try {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { checkInToken: token, checkInCode: code },
      })
      return { token: updated.checkInToken as string, code: updated.checkInCode as string }
    } catch (err) {
      if (isUniqueCheckInCodeViolation(err)) continue
      throw err
    }
  }
  throw new Error('Could not generate a unique check-in code')
}

export async function generateQrCodeDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 320, margin: 1 })
}
