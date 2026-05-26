-- Phase 17 gap closure: repair orphaned Foil card_definition_id values
-- Affects: SEC Foil rows (~38) and SOR Foil rows (~12) where Pass 2 name match failed
-- Safe to run multiple times (idempotent): WHERE clause only matches truly orphaned rows

-- Step 1: Show the orphaned rows BEFORE repair (diagnostic — review count before proceeding)
SELECT
  cp.id            AS foil_printing_id,
  cp.collector_number,
  cp.set_code,
  cp.card_definition_id AS orphaned_def_id,
  cd_orphan.swudb_id  AS orphaned_swudb_id,
  REGEXP_REPLACE(cp.collector_number, 'F$', '') AS expected_normal_swudb_id
FROM card_printings cp
JOIN card_definitions cd_orphan ON cd_orphan.id = cp.card_definition_id
WHERE
  cp.variant_type = 'Foil'
  AND cp.collector_number LIKE '%F'
  AND NOT EXISTS (
    -- The orphaned definition has no Normal printing in the same set
    SELECT 1
    FROM card_printings cp2
    WHERE cp2.card_definition_id = cp.card_definition_id
      AND cp2.set_code = cp.set_code
      AND cp2.variant_type = 'Normal'
  )
ORDER BY cp.set_code, cp.collector_number;

-- Step 2: Perform the repair
-- For each orphaned Foil row, look up the Normal's card_definition by stripping 'F' from
-- the collector_number to get swudb_id, then update card_definition_id accordingly.
UPDATE card_printings cp
SET card_definition_id = cd_normal.id
FROM card_definitions cd_normal
WHERE
  cp.variant_type = 'Foil'
  AND cp.collector_number LIKE '%F'
  AND cd_normal.swudb_id = REGEXP_REPLACE(cp.collector_number, 'F$', '')
  AND NOT EXISTS (
    -- Only update truly orphaned rows (no Normal printing under the current definition)
    SELECT 1
    FROM card_printings cp2
    WHERE cp2.card_definition_id = cp.card_definition_id
      AND cp2.set_code = cp.set_code
      AND cp2.variant_type = 'Normal'
  );

-- Step 3: Verify repair — this query should return 0 rows after repair
SELECT COUNT(*) AS remaining_orphans
FROM card_printings cp
JOIN card_definitions cd_orphan ON cd_orphan.id = cp.card_definition_id
WHERE
  cp.variant_type = 'Foil'
  AND cp.collector_number LIKE '%F'
  AND NOT EXISTS (
    SELECT 1
    FROM card_printings cp2
    WHERE cp2.card_definition_id = cp.card_definition_id
      AND cp2.set_code = cp.set_code
      AND cp2.variant_type = 'Normal'
  );

-- Step 4: Confirm Death Trooper (SEC-030) now has a Foil row linked correctly
-- Expected: 0 rows returned (SEC-030F absent — will be inserted by re-seed in plan 17-10)
-- If 1 row returned with correct card_definition_id, repair already covered it.
SELECT cp.id, cp.collector_number, cp.variant_type, cp.card_definition_id,
       cd.swudb_id AS definition_swudb_id
FROM card_printings cp
JOIN card_definitions cd ON cd.id = cp.card_definition_id
WHERE cp.set_code = 'SEC'
  AND cd.swudb_id = 'SEC-030'
ORDER BY cp.variant_type;
