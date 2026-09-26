CREATE TABLE "traffic_stats" (
	"day" date NOT NULL,
	"source" text NOT NULL,
	"campaign" text DEFAULT '' NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "traffic_stats_day_source_campaign_pk" PRIMARY KEY("day","source","campaign")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "campaign" text;--> statement-breakpoint
ALTER TABLE "product_stats" ADD COLUMN "ad_opens" integer DEFAULT 0 NOT NULL;