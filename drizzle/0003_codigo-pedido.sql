ALTER TABLE "orders" ADD COLUMN "code" text;--> statement-breakpoint
-- Pedidos que já existiam ganham um código de 6 dígitos derivado do id (único).
UPDATE "orders" SET "code" = (100000 + "id")::text WHERE "code" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_code_unique" UNIQUE("code");
