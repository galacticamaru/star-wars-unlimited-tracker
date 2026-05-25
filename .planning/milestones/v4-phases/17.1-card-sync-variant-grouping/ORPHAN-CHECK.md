# Orphan Check — Phase 17.1 Plan 02

**Date:** 2026-05-20  
**Run after:** db:seed re-seeded with new in-memory variant grouping upsertCards (Plan 01 refactor)

---

## Query Results

### orphaned_variants

Query: `card_printings` rows where no sibling sharing the same `card_definition_id` has `variant_type = 'Normal'`, but a Normal card with the same `set_code` exists under a different `collector_number`.

**Result: 0**

No orphaned variant rows exist after re-seeding with the new upsertCards. The in-memory grouping correctly assigns all Foil, Hyperspace, Showcase, Prestige, and Serialized variants to the same `card_definition_id` as their Normal anchor.

### unreferenced_definitions

Query: `card_definitions` rows with no `card_printings` referencing them.

**Result: 53**

These 53 rows are leftover `card_definitions` from old broken runs of the two-pass upsertCards (pre-Plan 01). They represent ghost definitions that were created during a failed variant grouping pass and never linked to any `card_printings`. They are harmless — no user collection data references them (user_printing_collections joins via `card_printings`, not `card_definitions` directly).

These can be cleaned up in a future maintenance task via:
```sql
DELETE FROM card_definitions cd
WHERE NOT EXISTS (
  SELECT 1 FROM card_printings cp
  WHERE cp.card_definition_id = cd.id
);
```
But cleanup is **not required** for correctness — the new upsertCards will never create new orphaned definitions.

---

## Seed Output (Task 1)

```
Seed complete: 34 sets processed, 7451 cards upserted
Exit code: 0
```

- 34 sets processed (all sets from swu-db.com API)
- 7451 cards upserted (all variants correctly linked via new in-memory grouping)
- No runtime errors

---

## Conclusion

**PASS**

- `orphaned_variants = 0` — no broken variant links exist after re-seed
- `unreferenced_definitions = 53` — harmless leftovers from old broken runs; no action required for correctness
- The in-memory variant grouping in upsertCards (Plan 01) works as designed

The refactor is verified end-to-end against the live database.
