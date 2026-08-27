-- Makes Bulletin.imageUrl optional: not every category requires an image
-- (see BULLETIN_CATEGORY_RULES in src/lib/bulletin-validation.ts).

ALTER TABLE "bulletins" ALTER COLUMN "image_url" DROP NOT NULL;
