ALTER TABLE "products" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "markup_type" text DEFAULT 'percent' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "markup_value" numeric(10, 2);