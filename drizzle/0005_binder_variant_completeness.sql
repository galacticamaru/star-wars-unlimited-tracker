ALTER TABLE "trade_manual_wants" ADD COLUMN "card_printing_id" integer;
--> statement-breakpoint
UPDATE "trade_manual_wants" tmw
SET "card_printing_id" = cp.id
FROM "card_printings" cp
WHERE cp.card_definition_id = tmw.card_definition_id
  AND cp.variant_type = 'Normal';
--> statement-breakpoint
DELETE FROM "trade_manual_wants" WHERE "card_printing_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "trade_manual_wants" ALTER COLUMN "card_printing_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "trade_manual_wants" ADD CONSTRAINT "trade_manual_wants_card_printing_id_card_printings_id_fk" FOREIGN KEY ("card_printing_id") REFERENCES "public"."card_printings"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trade_manual_wants" DROP CONSTRAINT "trade_manual_wants_user_id_card_definition_id_pk";
--> statement-breakpoint
ALTER TABLE "trade_manual_wants" DROP COLUMN "card_definition_id";
--> statement-breakpoint
ALTER TABLE "trade_manual_wants" ADD CONSTRAINT "trade_manual_wants_user_id_card_printing_id_pk" PRIMARY KEY ("user_id", "card_printing_id");
