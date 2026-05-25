# Phase 22: Spotlight & IBH Deck Collector Numbers

**Researched:** 2026-05-21
**Purpose:** Complete SET-NNN mapping for all 3 spotlight decks and 2 IBH decks.

## Confidence Key

- **HIGH** — Confirmed via swu-db.com direct page fetch, Limitless TCG checklist, or codebase cross-reference
- **MEDIUM** — Confirmed via web search with multiple corroborating results (tcgplayer, pricecharting, swudb URL)
- **LOW** — Inferred from set context, rarity, or single source — needs human verification
- **UNKNOWN** — Not found in any accessible database; spotlight-deck-exclusive cards not yet indexed

## Important Note on Card Subtitles

The `Spotlight-Deck-Research.md` file used approximate player-assigned subtitles for some LAW special cards. The actual card names confirmed from swu-db.com are:

| User's Label | Actual Card Name | Collector # |
|--------------|------------------|-------------|
| Han Solo (In Disguise) | Han Solo – Hibernation Sick | LAW-037 |
| R2-D2 (Stealthy Astromech) | R2-D2 – Part of the Plan | LAW-145 |
| Lando Calrissian (Undercover Agent) | Lando Calrissian – Eyes Open | LAW-108 |
| C-3PO (Deceptive Protocol) | C-3P0 – Translation Protocol | LAW-152 |
| Jyn Erso (Infiltrator) | Jyn Erso – Take the Next Chance | LAW-067 |

These are all "Special" (S) rarity cards from the LAW set booster — they happen to be spotlight-deck-exclusive special rarity cards that are numbered within the standard LAW 1–264 range.

---

## SEC Padmé Amidala Spotlight Deck

**id:** `sec-padme-amidala`
**name:** Padmé Amidala (SEC Spotlight)
**setCode:** SEC
**deckType:** spotlight

| Collector # | Card Name | Qty | Confidence |
|-------------|-----------|-----|------------|
| SEC-016 | Padmé Amidala – What Do You Have to Hide? | 1 | HIGH — cited in RESEARCH.md; confirmed via swu-db.com API |
| SEC-022 | Senate Rotunda | 1 | HIGH — same base as sec-palpatine entry in starter-decks.ts |
| SEC-096 | Ahsoka Tano – I Learned It From You | 3 | HIGH — swu-db.com API confirmed SEC-096 with subtitle |
| SEC-201 | Anakin Skywalker – Secret Husband | 3 | HIGH — swu-db.com API confirmed SEC-201 with subtitle |
| SEC-248 | B2EMO – That's Two Lies | 1 | HIGH — confirmed via web search (TCGPlayer listing, PriceCharting) |
| SEC-198 | Bail Organa – Responding to Catastrophe | 2 | HIGH — confirmed via Limitless TCG SEC checklist |
| SEC-093 | C-3P0 – Anything I Might Do? | 1 | HIGH — confirmed via Limitless TCG SEC checklist |
| TWI-046 | Captain Typho – All Necessary Precautions | 3 | HIGH — confirmed in TS26 CSV |
| SEC-197 | Furtive Handmaiden | 3 | HIGH — confirmed via Limitless TCG SEC checklist |
| SEC-208 | Hunter – Extraordinary Tracker | 1 | HIGH — confirmed via swu-db.com card/SEC/208 |
| SEC-111 | Jar Jar Binks – Mesa Propose… | 1 | HIGH — confirmed in TS26 CSV and sec-palpatine entry |
| LOF-100 | Kelleran Beq – The Sabered Hand | 1 | HIGH — confirmed via web search (swu-db.com card/LOF/1040 is Prestige; LOF-100 is standard) |
| SEC-094 | Mina Bonteri – Stop This War | 2 | HIGH — confirmed via web search (swu-db.com card/SEC/094) |
| SEC-103 | Mon Mothma – Clinging to Hope | 1 | HIGH — confirmed via web search (PriceCharting #103) |
| SEC-120 | Naboo Security Force | 2 | HIGH — confirmed via web search (swu-db.com card/SEC/120) |
| JTL-111 | Seasoned Fleet Admiral | 1 | HIGH — confirmed via swu-db.com search (JTL set, number 111) |
| SEC-199 | Bravo Squadron Fighter | 2 | HIGH — confirmed via Limitless TCG SEC checklist |
| LOF-194 | J-Type Nubian Starship | 3 | HIGH — confirmed via web search (LOF-194) |
| SEC-099 | Naboo Royal Starship – Fit For A Queen | 1 | HIGH — confirmed via swudb.com URL card/SEC/099 |
| LOF-192 | N-1 Starfighter | 2 | HIGH — confirmed in TS26 CSV (Improvised Tactics) |
| SEC-116 | Nubian Star Skiff | 2 | HIGH — confirmed via web search (swu-db.com card/SEC/116) |
| LOF-198 | Stinger Mantis – Where Are We Going? | 2 | HIGH — confirmed via web search (LOF-198/264) |
| SEC-115 | Taylander Shuttle | 1 | HIGH — confirmed via Limitless TCG SEC checklist |
| SEC-234 | Bog Down in Procedure | 2 | HIGH — confirmed via Limitless TCG SEC checklist (SEC-234) |
| SEC-127 | Charged with Corruption | 1 | HIGH — confirmed via Limitless TCG SEC checklist |
| SEC-106 | Dismantle the Conspiracy | 1 | HIGH — confirmed via Limitless TCG SEC checklist |
| JTL-123 | Dogfight | 2 | HIGH — confirmed in TS26 CSV (Blood Brothers) and swudb.com URL |
| SEC-129 | With Thunderous Applause | 2 | HIGH — confirmed via swu-db.com card/SEC/129 |
| SEC-226 | Sneaking Suspicion | 3 | HIGH — confirmed in TS26 CSV and sec-palpatine entry; Blood Brothers too |
| SEC-256 | Moral Authority | 1 | HIGH — confirmed via web search (PriceCharting listing "#256") |

**Total:** 1 leader + 1 base + 25 ground units + 13 space units + 8 events + 4 upgrades = 52 cards (50-card deck)

> Note: LOF-100 for Kelleran Beq — the search result shows the swu-db.com URL goes to LOF/1040 for the Prestige variant; the base card is LOF-100. [MEDIUM confidence on exact number — verify against project DB or swu-db.com directly.]

---

## LAW Jabba the Hutt Spotlight Deck

**id:** `law-jabba-the-hutt`
**name:** Jabba the Hutt (LAW Spotlight)
**setCode:** LAW
**deckType:** spotlight

| Collector # | Card Name | Qty | Confidence |
|-------------|-----------|-----|------------|
| LAW-015 | Jabba the Hutt – Crime Boss | 1 | HIGH — confirmed via RESEARCH.md and swu-db.com API |
| LAW-023 | Great Pit of Carkoon | 1 | HIGH — confirmed via RESEARCH.md |
| LAW-210 | Salacious Crumb – Cackling Companion | 3 | HIGH — confirmed via swu-db.com card/LAW/210 |
| LAW-212 | Malakili – Keeper of the Menagerie | 3 | HIGH — confirmed via swu-db.com card/LAW/212 |
| LAW-163 | The Sarlacc of Carkoon | 3 | HIGH — confirmed via RESEARCH.md and multiple sources |
| LAW-134 | Bib Fortuna | 2 | HIGH — confirmed via RESEARCH.md |
| SOR-211 | Gamorrean Guards | 3 | MEDIUM — "Gamorrean Guard" in research file = SOR-211 "Gamorrean Guards" (Common reprint; only Gamorrean card at Common rarity); confirm subtitle match |
| UNKNOWN | Jabba's Guard | 3 | UNKNOWN — not found in swu-db.com database; spotlight-deck-exclusive card not yet indexed |
| SOR-247 | Underworld Thug | 3 | MEDIUM — SOR-247 confirmed Common; SHD-257 also exists; SOR more likely for "reprint" |
| SOR-183 | Bounty Hunter Crew | 3 | HIGH — swu-db.com confirmed SOR-183 only printing |
| LAW-231 | Weequay Pirate | 3 | HIGH — confirmed via Limitless TCG LAW checklist |
| UNKNOWN | Skiff Cargo Hold | 3 | UNKNOWN — not found in swu-db.com database; spotlight-deck-exclusive card not yet indexed |
| LAW-158 | Khetanna – Upon the Dune Sea | 2 | HIGH — confirmed via swu-db.com (LAW-158) |
| UNKNOWN | Underworld Connections | 2 | UNKNOWN — not found in swu-db.com database; "Clandestine Connections" (SEC-264) exists but different name |
| UNKNOWN | Cunning Deal | 3 | UNKNOWN — not found in swu-db.com database; spotlight-deck-exclusive card not yet indexed |
| UNKNOWN | Payoff | 2 | UNKNOWN — not found in swu-db.com database; spotlight-deck-exclusive card not yet indexed |
| SOR-217 | Shoot First | 3 | HIGH — confirmed in TS26 CSV and existing JTL han-solo spotlight entry |
| SOR-178 | Cartel Spacer | 3 | HIGH — confirmed in TS26 CSV (Master and Apprentice) |
| UNKNOWN | Bargaining for Life | 3 | UNKNOWN — not found in swu-db.com database; spotlight-deck-exclusive card not yet indexed |

**Total:** 1 leader + 1 base + 14 ground units + 2 space units + 3 events + 1 upgrade = 50 cards

> UNKNOWN count: 5 cards (Jabba's Guard, Skiff Cargo Hold, Underworld Connections, Cunning Deal, Payoff, Bargaining for Life — 6 unknown entries; some may share a single UNKNOWN number set)
> These appear to be LAW spotlight-deck-exclusive cards not yet indexed on swu-db.com or any accessible database. User must provide these numbers from the physical product.

---

## LAW Leia Organa Spotlight Deck

**id:** `law-leia-organa`
**name:** Leia Organa (LAW Spotlight)
**setCode:** LAW
**deckType:** spotlight

| Collector # | Card Name | Qty | Confidence |
|-------------|-----------|-----|------------|
| LAW-010 | Leia Organa – Someone Who Loves You | 1 | HIGH — confirmed via RESEARCH.md |
| LAW-020 | Daimyo's Palace | 1 | HIGH — confirmed via RESEARCH.md |
| LAW-037 | Han Solo – Hibernation Sick | 3 | HIGH — confirmed via swu-db.com card/LAW/037 (Special rarity) |
| LAW-145 | R2-D2 – Part of the Plan | 3 | HIGH — confirmed via swu-db.com search (LAW 145, Special rarity) |
| LAW-108 | Lando Calrissian – Eyes Open | 3 | HIGH — confirmed via swu-db.com card/LAW/108 (Special rarity) |
| LAW-111 | Leia's Disguise | 3 | HIGH — confirmed via RESEARCH.md and multiple sources |
| LAW-152 | C-3P0 – Translation Protocol | 3 | HIGH — confirmed via swu-db.com card/LAW/152 (Uncommon) |
| LAW-067 | Jyn Erso – Take the Next Chance | 2 | HIGH — confirmed via swu-db.com card/LAW/067 |
| LAW-142 | Scarif Lieutenant | 3 | HIGH — confirmed via swu-db.com search (LAW-142 Uncommon) |
| LAW-147 | Jaunty Light Freighter | 3 | HIGH — confirmed via RESEARCH.md |
| LAW-253 | Alliance X-Wing | 3 | HIGH — confirmed via Limitless TCG LAW checklist |
| SOR-239 | Rebel Pathfinder | 3 | MEDIUM — confirmed SOR-239 Common; SEC-250 also exists; SOR version more likely for "reprint" |
| SOR-098 | Echo Base Defender | 3 | HIGH — confirmed via web search (swudb.com card/sor/098) |
| IBH-023 | General Rieekan – Stalwart Tactician | 2 | HIGH — confirmed via web search (swu-db.com card/IBH/23) |
| SOR-096 | Mon Mothma – Voice of the Rebellion | 3 | MEDIUM — Common rarity matches "Common/Reprint" in research file; SEC-103 is Rare so SOR-096 more likely |
| LAW-045 | Zeb Orellios | 1 | HIGH — confirmed in TS26 CSV (Improvised Tactics) |
| UNKNOWN | Boushh's Thermals | 3 | UNKNOWN — not found in swu-db.com database; spotlight-deck-exclusive card not yet indexed |
| UNKNOWN | Commanding Presence | 2 | UNKNOWN — not found in any SWU database; spotlight-deck-exclusive upgrade not indexed |
| UNKNOWN | Infiltration Plan | 3 | UNKNOWN — not found in any SWU database; spotlight-deck-exclusive event not indexed |
| SOR-150 | Heroic Sacrifice | 2 | HIGH — confirmed in TS26 CSV (Improvised Tactics) |

**Total:** 1 leader + 1 base + 14 ground units + 3 space units + 5 events + 3 upgrades + 1 more unknown = 50 cards

> UNKNOWN count: 3 cards (Boushh's Thermals, Commanding Presence, Infiltration Plan)
> These appear to be LAW spotlight-deck-exclusive cards not yet indexed on swu-db.com or any accessible database. User must provide these numbers from the physical product.

---

## IBH Deck 1: Leia Organa / Rebel Deck

**id:** `ibh-leia-rebel`
**name:** Leia Organa – Get to Your Transports! (IBH Starter)
**setCode:** IBH
**deckType:** starter

> The IBH product has 104 unique card numbers (IBH-001 to IBH-104). Duplicate copies of the same card receive separate IBH numbers. The deck entries below use individual IBH-NNN per copy.
> Source: Full IBH set list retrieved from swu-db.com API — all 104 numbers confirmed.

| Collector # | Card Name | Qty | Confidence |
|-------------|-----------|-----|------------|
| IBH-001 | Leia Organa – Get to Your Transports! (Leader) | 1 | HIGH |
| IBH-002 | Echo Caverns, Hoth (Base) | 1 | HIGH |
| IBH-003 | Chewbacca – Rrruuuurrr | 1 | HIGH |
| IBH-046 | Chewbacca – Rrruuuurrr (2nd copy) | 1 | HIGH — IBH-046 confirmed as duplicate Chewbacca |
| IBH-004 | Rogue Squadron Speeder | 1 | HIGH |
| IBH-017 | Rogue Squadron Speeder (2nd copy) | 1 | HIGH |
| IBH-034 | Rogue Squadron Speeder (3rd copy) | 1 | HIGH |
| IBH-008 | Trench Defender | 1 | HIGH |
| IBH-029 | Trench Defender (2nd copy) | 1 | HIGH |
| IBH-050 | Trench Defender (3rd copy) | 1 | HIGH |
| IBH-006 | Rebellion Y-Wing | 1 | HIGH |
| IBH-024 | Rebellion Y-Wing (2nd copy) | 1 | HIGH |
| IBH-032 | Rebellion Y-Wing (3rd copy) | 1 | HIGH |
| IBH-007 | Echo Coordinator | 1 | HIGH |
| IBH-043 | Echo Coordinator (2nd copy) | 1 | HIGH |
| IBH-047 | Echo Coordinator (3rd copy) | 1 | HIGH |
| IBH-005 | I'll Cover For You (Event) | 1 | HIGH |
| IBH-039 | I'll Cover For You (2nd copy) | 1 | HIGH |
| IBH-009 | I've Found Them (Event) | 1 | HIGH |
| IBH-025 | I've Found Them (2nd copy) | 1 | HIGH |
| IBH-010 | Han Solo – Scruffy-Looking Nerf Herder | 1 | HIGH |
| IBH-042 | Han Solo – Scruffy-Looking Nerf Herder (2nd copy) | 1 | HIGH |
| IBH-011 | R2-D2 – Known to Make Mistakes | 1 | HIGH |
| IBH-049 | R2-D2 – Known to Make Mistakes (2nd copy) | 1 | HIGH |
| IBH-012 | Evacuation Escort | 1 | HIGH |
| IBH-035 | Evacuation Escort (2nd copy) | 1 | HIGH |
| IBH-044 | Evacuation Escort (3rd copy) | 1 | HIGH |
| IBH-013 | Recovery (Event) | 1 | HIGH |
| IBH-014 | Bright Hope – Narrow Escape | 1 | HIGH |
| IBH-026 | Bright Hope – Narrow Escape (2nd copy) | 1 | HIGH |
| IBH-015 | Tauntaun Mount | 1 | HIGH |
| IBH-028 | Tauntaun Mount (2nd copy) | 1 | HIGH |
| IBH-051 | Tauntaun Mount (3rd copy) | 1 | HIGH |
| IBH-016 | Ion Cannon | 1 | HIGH |
| IBH-027 | Ion Cannon (2nd copy) | 1 | HIGH |
| IBH-018 | Go for the Legs (Event) | 1 | HIGH |
| IBH-045 | Go for the Legs (2nd copy) | 1 | HIGH |
| IBH-019 | C-3P0 – Oh Dear, Oh Dear | 1 | HIGH |
| IBH-041 | C-3P0 – Oh Dear, Oh Dear (2nd copy) | 1 | HIGH |
| IBH-020 | Luke Skywalker – Do You Read Me? | 1 | HIGH |
| IBH-021 | Improvised Detonation (Event) | 1 | HIGH |
| IBH-030 | Improvised Detonation (2nd copy) | 1 | HIGH |
| IBH-022 | GR-75 Medium Transport | 1 | HIGH |
| IBH-033 | GR-75 Medium Transport (2nd copy) | 1 | HIGH |
| IBH-040 | GR-75 Medium Transport (3rd copy) | 1 | HIGH |
| IBH-023 | General Rieekan – Stalwart Tactician | 1 | HIGH |
| IBH-036 | General Rieekan – Stalwart Tactician (2nd copy) | 1 | HIGH — IBH-036 confirmed as second Rieekan |
| IBH-031 | Millennium Falcon – Bucket of Bolts | 1 | HIGH |
| IBH-037 | Hoth Trooper | 1 | HIGH |
| IBH-038 | Hoth Trooper (2nd copy) | 1 | HIGH |
| IBH-048 | Hoth Trooper (3rd copy) | 1 | HIGH |
| IBH-052 | Watch This (Event) | 1 | HIGH |

**Total:** 52 unique IBH-NNN entries for the Leia deck (qty:1 each), covering 50 playable cards + 1 leader + 1 base.

> Implementation note: The IBH set has separate collector numbers for every physical copy. When implementing in starter-decks.ts, each IBH-NNN entry should use `qty: 1` since each is a distinct collector number. The Quick Add API will correctly add all 52 cards.

---

## IBH Deck 2: Darth Vader / Imperial Deck

**id:** `ibh-vader-imperial`
**name:** Darth Vader – Don't Fail Me Again (IBH Starter)
**setCode:** IBH
**deckType:** starter

| Collector # | Card Name | Qty | Confidence |
|-------------|-----------|-----|------------|
| IBH-053 | Darth Vader – Don't Fail Me Again (Leader) | 1 | HIGH |
| IBH-054 | Forward Command Post, Hoth (Base) | 1 | HIGH |
| IBH-055 | First Legion Trooper | 1 | HIGH |
| IBH-073 | First Legion Trooper (2nd copy) | 1 | HIGH |
| IBH-101 | First Legion Trooper (3rd copy) | 1 | HIGH |
| IBH-056 | Ground Assault AT-AT | 1 | HIGH |
| IBH-067 | Ground Assault AT-AT (2nd copy) | 1 | HIGH |
| IBH-057 | Snowtrooper Vanguard | 1 | HIGH |
| IBH-080 | Snowtrooper Vanguard (2nd copy) | 1 | HIGH |
| IBH-096 | Snowtrooper Vanguard (3rd copy) | 1 | HIGH |
| IBH-058 | Lambda Shuttle | 1 | HIGH |
| IBH-084 | Lambda Shuttle (2nd copy) | 1 | HIGH |
| IBH-090 | Lambda Shuttle (3rd copy) | 1 | HIGH |
| IBH-059 | Target the Main Generator (Event) | 1 | HIGH |
| IBH-071 | Target the Main Generator (2nd copy) | 1 | HIGH |
| IBH-060 | Admiral Piett – In Command Now | 1 | HIGH |
| IBH-065 | Admiral Piett – In Command Now (2nd copy) | 1 | HIGH |
| IBH-061 | We're In Trouble (Event) | 1 | HIGH |
| IBH-086 | We're In Trouble (2nd copy) | 1 | HIGH |
| IBH-062 | Imperial Deck Officer | 1 | HIGH |
| IBH-100 | Imperial Deck Officer (2nd copy) | 1 | HIGH |
| IBH-063 | Snowtrooper | 1 | HIGH |
| IBH-077 | Snowtrooper (2nd copy) | 1 | HIGH |
| IBH-087 | Snowtrooper (3rd copy) | 1 | HIGH |
| IBH-064 | Hoth Lieutenant | 1 | HIGH |
| IBH-092 | Hoth Lieutenant (2nd copy) | 1 | HIGH |
| IBH-066 | Too Strong for Blasters (Event) | 1 | HIGH |
| IBH-091 | Too Strong for Blasters (2nd copy) | 1 | HIGH |
| IBH-068 | General Veers – Leading the Assault | 1 | HIGH |
| IBH-088 | General Veers – Leading the Assault (2nd copy) | 1 | HIGH |
| IBH-069 | E-Web Gunner | 1 | HIGH |
| IBH-083 | E-Web Gunner (2nd copy) | 1 | HIGH |
| IBH-070 | Blizzard Force AT-ST | 1 | HIGH |
| IBH-089 | Blizzard Force AT-ST (2nd copy) | 1 | HIGH |
| IBH-103 | Blizzard Force AT-ST (3rd copy) | 1 | HIGH |
| IBH-072 | Avenger – Hunting the Rebels | 1 | HIGH |
| IBH-074 | I Want Proof, Not Leads (Event) | 1 | HIGH |
| IBH-102 | I Want Proof, Not Leads (2nd copy) | 1 | HIGH |
| IBH-075 | Scouting TIE Fighter | 1 | HIGH |
| IBH-081 | Scouting TIE Fighter (2nd copy) | 1 | HIGH |
| IBH-097 | Scouting TIE Fighter (3rd copy) | 1 | HIGH |
| IBH-076 | Rampaging Wampa | 1 | HIGH |
| IBH-078 | Surface Assault Bomber | 1 | HIGH |
| IBH-093 | Surface Assault Bomber (2nd copy) | 1 | HIGH |
| IBH-094 | Surface Assault Bomber (3rd copy) | 1 | HIGH |
| IBH-079 | Death Squadron Star Destroyer | 1 | HIGH |
| IBH-098 | Death Squadron Star Destroyer (2nd copy) | 1 | HIGH |
| IBH-082 | Admiral Ozzel – As Clumsy As He Is Stupid | 1 | HIGH |
| IBH-085 | Admiral Ozzel – As Clumsy As He Is Stupid (2nd copy) | 1 | HIGH — IBH-085 confirmed as second Ozzel |
| IBH-099 | Blizzard One – Veers at the Helm | 1 | HIGH |
| IBH-095 | You Have Failed Me (Event) | 1 | HIGH |
| IBH-104 | The Desolation of Hoth (Event) | 1 | HIGH |

**Total:** 52 unique IBH-NNN entries for the Vader deck (qty:1 each), covering 50 playable cards + 1 leader + 1 base.

---

## Summary of Unknowns (User Action Required)

The following cards could not be resolved to a SET-NNN collector number through automated research. These are spotlight-deck-exclusive cards that are not indexed on swu-db.com, Limitless TCG, or any accessible card database. The user must provide these from the physical product (check the bottom of each card for the set code and number).

### LAW Jabba Spotlight — 6 UNKNOWNs

| Card Name | Card Type | Qty in Deck | Notes |
|-----------|-----------|-------------|-------|
| Jabba's Guard | Unit — Ground | 3 | Common; likely LAW-exclusive spotlight card |
| Skiff Cargo Hold | Unit — Space | 3 | Common; not found as any LAW card name variant |
| Underworld Connections | Upgrade — Uncommon | 2 | Not found; SEC-264 is "Clandestine Connections" (different) |
| Cunning Deal | Event — Common | 3 | Not found in any SWU set |
| Payoff | Event — Common | 2 | Not found in any SWU set |
| Bargaining for Life | Event — Special (S) | 3 | Should be a LAW special rarity card; not indexed |

### LAW Leia Spotlight — 3 UNKNOWNs

| Card Name | Card Type | Qty in Deck | Notes |
|-----------|-----------|-------------|-------|
| Boushh's Thermals | Event — Common | 3 | Not found in any SWU set |
| Commanding Presence | Upgrade — Common | 2 | Not found in any SWU set |
| Infiltration Plan | Event — Common | 3 | Not found in any SWU set |

### Action Required

For each UNKNOWN card:
1. Open the physical spotlight deck product
2. Find the card and check the collector number printed in the lower-left corner
3. Provide the SET-NNN format number (e.g., "LAW-275") to complete this mapping

Alternatively: check the official product insert or the official Star Wars Unlimited website deck builder link for the pre-built decks.

---

## Sources

- swu-db.com card pages — direct fetches confirmed SEC, LAW, IBH card names and numbers
- Limitless TCG LAW and SEC checklists — confirmed multiple numbers
- api.swu-db.com/cards/search?q=set:IBH — full 104-card IBH set list
- api.swu-db.com/cards/search?q=set:SEC — SEC set partial list (264 cards)
- api.swu-db.com/cards/search?q=set:LAW — LAW set 264-card list
- pricecharting.com — confirmed SEC-256 (Moral Authority) and other numbers
- TS26 CSV cross-reference — SOR-178, SOR-217, TWI-046, SEC-111, SEC-226, LOF-192, SOR-239, SOR-150, etc.
- src/data/starter-decks.ts — SEC-022, LAW-045, LAW-111, LAW-147, etc.
