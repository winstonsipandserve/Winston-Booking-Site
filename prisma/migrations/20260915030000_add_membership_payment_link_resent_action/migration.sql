-- Master copy of prisma/migrations/20260915030000_add_membership_payment_link_resent_action.
-- Lets admin activity logging record when staff manually resend an expired membership
-- payment link (mirrors 20260915010000_add_member_activation_resend_action).
ALTER TYPE "AdminActivityAction" ADD VALUE 'membership_payment_link_resent';
