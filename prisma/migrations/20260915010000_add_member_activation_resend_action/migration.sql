-- Master copy of prisma/migrations/20260915010000_add_member_activation_resend_action.
-- Lets admin activity logging record when staff manually resend a member's activation link.
ALTER TYPE "AdminActivityAction" ADD VALUE 'member_activation_link_resent';
