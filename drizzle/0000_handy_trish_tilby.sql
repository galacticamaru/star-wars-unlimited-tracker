CREATE TABLE "card_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"swudb_id" text NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"type" text NOT NULL,
	"aspects" text[] DEFAULT '{}'::text[] NOT NULL,
	"arenas" text[] DEFAULT '{}'::text[] NOT NULL,
	"traits" text[] DEFAULT '{}'::text[] NOT NULL,
	"keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"cost" integer,
	"power" integer,
	"hp" integer,
	"front_text" text,
	"back_text" text,
	"epic_action" text,
	"double_sided" boolean DEFAULT false NOT NULL,
	"unique" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_definitions_swudb_id_unique" UNIQUE("swudb_id")
);
--> statement-breakpoint
CREATE TABLE "card_printings" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_definition_id" integer NOT NULL,
	"set_code" text NOT NULL,
	"collector_number" text NOT NULL,
	"rarity" text NOT NULL,
	"variant_type" text NOT NULL,
	"front_art_url" text,
	"back_art_url" text,
	"artist" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_printings_set_code_collector_number_unique" UNIQUE("set_code","collector_number")
);
--> statement-breakpoint
CREATE TABLE "deck_cards" (
	"deck_id" integer NOT NULL,
	"card_definition_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_sideboard" boolean DEFAULT false NOT NULL,
	CONSTRAINT "deck_cards_deck_id_card_definition_id_is_sideboard_pk" PRIMARY KEY("deck_id","card_definition_id","is_sideboard")
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"leader_card_definition_id" integer,
	"base_card_definition_id" integer,
	"is_draft" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_collections" (
	"user_id" integer DEFAULT 1 NOT NULL,
	"card_definition_id" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_collections_user_id_card_definition_id_pk" PRIMARY KEY("user_id","card_definition_id")
);
--> statement-breakpoint
ALTER TABLE "card_printings" ADD CONSTRAINT "card_printings_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_leader_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("leader_card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_base_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("base_card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_card_definition_id_card_definitions_id_fk" FOREIGN KEY ("card_definition_id") REFERENCES "public"."card_definitions"("id") ON DELETE no action ON UPDATE no action;