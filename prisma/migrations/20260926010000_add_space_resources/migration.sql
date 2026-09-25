-- Master copy of prisma/migrations/20260926010000_add_space_resources.
-- Bookable spaces (lounge, conference room): a third resource category alongside courts and
-- simulators. Rows are created by prisma/seed.ts; this migration only extends the enums.
ALTER TYPE "ResourceCategory" ADD VALUE IF NOT EXISTS 'space';
ALTER TYPE "ResourceTypeSlug" ADD VALUE IF NOT EXISTS 'lounge';
ALTER TYPE "ResourceTypeSlug" ADD VALUE IF NOT EXISTS 'conference_room';
