ALTER TABLE "orders" ADD COLUMN "payment_method" text DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_discount" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_data" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "public_token" text DEFAULT md5(random()::text || clock_timestamp()::text) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_public_token_unique" UNIQUE("public_token");