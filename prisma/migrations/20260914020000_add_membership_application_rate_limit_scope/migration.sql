-- Master copy of prisma/migrations/20260914020000_add_membership_application_rate_limit_scope.
-- Per-IP throttle for POST /api/membership-applications reuses the auth abuse-control counter.
ALTER TYPE "AuthRateLimitScope" ADD VALUE IF NOT EXISTS 'membership_application';
