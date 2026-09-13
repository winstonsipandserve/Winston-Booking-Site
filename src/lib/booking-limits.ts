// Client-safe booking limits (no Prisma import). The server enforces these in
// POST /api/bookings; the wizard reads them so its options never exceed what the API accepts.

/** Longest single court booking. Simulators are already bounded by their pricing tiers. */
export const MAX_COURT_DURATION_MINUTES = 240

/** Hold creations allowed per client inside the shared 15-minute rate-limit window. */
export const HOLD_CREATIONS_PER_WINDOW = 10

/** Hold creations allowed per IP inside the window, applied on top of the member cap. */
export const HOLD_CREATIONS_PER_IP_PER_WINDOW = 20

/** Unpaid holds one client may have live at once. */
export const MAX_LIVE_HOLDS_PER_CLIENT = 3
