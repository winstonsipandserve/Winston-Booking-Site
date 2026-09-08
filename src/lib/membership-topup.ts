// Self-service top-up preset amounts (₱1,000 / ₱2,500 / ₱5,000 / ₱10,000) — the only
// amounts a member can choose via PayMongo checkout. Admin-logged top-ups (cash/manual_online)
// aren't bound by this list, only by ADMIN_TOPUP_MIN_CENTAVOS. See CLAUDE.md → Membership
// credit ledger.
export const TOPUP_PRESETS_CENTAVOS = [100_000, 250_000, 500_000, 1_000_000] as const

export function isValidTopUpPresetCentavos(value: unknown): value is number {
  return typeof value === 'number' && (TOPUP_PRESETS_CENTAVOS as readonly number[]).includes(value)
}

// ₱100 — front-desk cash/online top-ups have no fixed preset ceiling, only this floor.
export const ADMIN_TOPUP_MIN_CENTAVOS = 10_000
