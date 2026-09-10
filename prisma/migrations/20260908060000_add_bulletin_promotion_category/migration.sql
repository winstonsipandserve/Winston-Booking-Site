-- Adds the 7th BulletinCategory value, 'Promotion'. Run as its own migration, ahead of
-- the column-add migration (20260908070000_add_bulletin_promotion_fields) that follows —
-- same split convention established by 20260827040000_add_bulletin_category_values:
-- ALTER TYPE ... ADD VALUE must not be combined with other DDL in the same transaction
-- on some Postgres versions.

ALTER TYPE "BulletinCategory" ADD VALUE 'Promotion';
