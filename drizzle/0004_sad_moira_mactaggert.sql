CREATE TABLE "trade_exclusions" (
	"user_id" integer NOT NULL,
	"card_definition_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trade_exclusions_user_id_card_definition_id_pk" PRIMARY KEY("user_id","card_definition_id")
);
--> statement-breakpoint
CREATE TABLE "trade_manual_wants" (
	"user_id" integer NOT NULL,
	"card_definition_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trade_manual_wants_user_id_card_definition_id_pk" PRIMARY KEY("user_id","card_definition_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "user_collections" ADD COLUMN "trade_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_exclusions" ADD CONSTRAINT "trade_exclusions_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_manual_wants" ADD CONSTRAINT "trade_manual_wants_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");