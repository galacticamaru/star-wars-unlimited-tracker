import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const cardDefinitions = pgTable('card_definitions', {
  id: serial('id').primaryKey(),
  // Canonical identifier: "{Set}-{Number}" of the Normal variant printing
  // This is the upsert key — variant printings (Foil/Hyperspace) share this row
  swudbId: text('swudb_id').notNull().unique(),
  name: text('name').notNull(),
  subtitle: text('subtitle'),
  type: text('type').notNull(), // "Unit" | "Leader" | "Event" | "Upgrade" | "Base"
  aspects: text('aspects').array().notNull().default(sql`'{}'::text[]`),
  arenas: text('arenas').array().notNull().default(sql`'{}'::text[]`),
  traits: text('traits').array().notNull().default(sql`'{}'::text[]`),
  keywords: text('keywords').array().notNull().default(sql`'{}'::text[]`),
  // Numeric fields: stored as integer (not text) to support proper sorting in Phase 2
  // Parse from API string on ingest: parseInt(card.Cost ?? '', 10) || null
  cost: integer('cost'), // null for cards with no cost (Events, Bases without cost)
  power: integer('power'), // null for non-units
  hp: integer('hp'), // null for non-units
  frontText: text('front_text'),
  backText: text('back_text'), // Leader back side text
  epicAction: text('epic_action'), // Leader epic action text
  doubleSided: boolean('double_sided').notNull().default(false),
  unique: boolean('unique').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cardPrintings = pgTable(
  'card_printings',
  {
    id: serial('id').primaryKey(),
    cardDefinitionId: integer('card_definition_id')
      .notNull()
      .references(() => cardDefinitions.id),
    setCode: text('set_code').notNull(), // e.g., "SOR"
    collectorNumber: text('collector_number').notNull(), // e.g., "SOR-059" (constructed: Set + "-" + Number)
    rarity: text('rarity').notNull(), // "Common" | "Uncommon" | "Rare" | "Legendary" | "Special"
    variantType: text('variant_type').notNull(), // "Normal" | "Foil" | "Hyperspace" | "Hyperspace Foil" | "Showcase"
    frontArtUrl: text('front_art_url'), // https://cdn.swu-db.com/images/cards/SOR/059.png
    backArtUrl: text('back_art_url'), // Leader back art URL
    artist: text('artist'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    // Composite unique: ensures one row per physical printing variant
    unique().on(t.setCode, t.collectorNumber),
  ]
);

export const userCollections = pgTable(
  'user_collections',
  {
    userId: integer('user_id').notNull().default(1),
    cardDefinitionId: integer('card_definition_id')
      .notNull()
      .references(() => cardDefinitions.id),
    count: integer('count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardDefinitionId] }),
  ]
);

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().default(1),
  name: text('name').notNull(),
  leaderCardDefinitionId: integer('leader_card_definition_id').references(() => cardDefinitions.id),
  baseCardDefinitionId: integer('base_card_definition_id').references(() => cardDefinitions.id),
  isDraft: boolean('is_draft').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deckCards = pgTable(
  'deck_cards',
  {
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    cardDefinitionId: integer('card_definition_id')
      .notNull()
      .references(() => cardDefinitions.id),
    quantity: integer('quantity').notNull().default(1),
    isSideboard: boolean('is_sideboard').notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.deckId, t.cardDefinitionId, t.isSideboard] }),
  ]
);
