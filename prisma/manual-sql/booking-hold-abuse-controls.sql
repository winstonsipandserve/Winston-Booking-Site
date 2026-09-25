-- Master copy of prisma/migrations/20260914010000_add_booking_hold_abuse_controls.
-- Hold-spam controls for POST /api/bookings: a rate-limit scope for hold creation and an
-- HMAC'd client key on bookings so live holds can be capped per client.

-- Reuse the auth abuse-control counter for hold creation.
ALTER TYPE "AuthRateLimitScope" ADD VALUE IF NOT EXISTS 'booking_hold';

-- HMAC of the creating client (member id, or request IP for anonymous bookers). Never raw.
ALTER TABLE "bookings"
ADD COLUMN "hold_client_hash" TEXT;

CREATE INDEX "bookings_hold_client_hash_status_created_at_idx"
ON "bookings"("hold_client_hash", "status", "created_at");
