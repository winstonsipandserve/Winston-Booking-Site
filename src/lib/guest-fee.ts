import type { GuestFeeRule, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Db = Prisma.TransactionClient | typeof prisma

/**
 * The single guest-fee row (docs/decisions.md → "The guest fee gets its own table"). The table
 * is meant to hold exactly one row, but nothing in the schema enforces that, so every reader
 * goes through this deterministic order: if a second row ever appears, pricing, the wizard,
 * and the admin panel all keep reading the same (oldest) row instead of whichever Postgres
 * happens to return first.
 */
export function getGuestFeeRule(db: Db = prisma): Promise<GuestFeeRule | null> {
  return db.guestFeeRule.findFirst({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })
}
