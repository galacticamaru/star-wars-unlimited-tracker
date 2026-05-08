ALTER TABLE "card_definitions" ADD COLUMN "price_eur" integer;--> statement-breakpoint
ALTER TABLE "card_definitions" ADD COLUMN "price_usd" integer;--> statement-breakpoint
ALTER TABLE "card_definitions" ADD COLUMN "prices_updated_at" timestamp;