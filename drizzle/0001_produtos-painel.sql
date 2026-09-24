ALTER TABLE "products" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" SET DATA TYPE jsonb USING '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "weight_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "height_cm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "width_cm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "length_cm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "youtube_url" text;