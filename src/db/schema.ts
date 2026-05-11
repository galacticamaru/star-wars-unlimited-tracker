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

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable('session', {
  id: serial('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
});

export const account = pgTable('account', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

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
  priceEur: integer('price_eur'),
  priceUsd: integer('price_usd'),
  pricesUpdatedAt: timestamp('prices_updated_at'),
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
    userId: integer('user_id').notNull(),
    cardDefinitionId: integer('card_definition_id')
      .notNull()
      .references(() => cardDefinitions.id),
    count: integer('count').notNull().default(0),
    tradeQuantity: integer('trade_quantity').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardDefinitionId] }),
  ]
);

export const tradeExclusions = pgTable(
  'trade_exclusions',
  {
    userId: integer('user_id').notNull(),
    cardDefinitionId: integer('card_definition_id')
      .notNull()
      .references(() => cardDefinitions.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardDefinitionId] }),
  ]
);

export const tradeManualWants = pgTable(
  'trade_manual_wants',
  {
    userId: integer('user_id').notNull(),
    cardDefinitionId: integer('card_definition_id')
      .notNull()
      .references(() => cardDefinitions.id),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardDefinitionId] }),
  ]
);

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
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
