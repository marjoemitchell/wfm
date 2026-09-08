-- Deduplicate stale politician rows before adding uniqueness constraints.
-- These arose from ingest scripts previously upserting on `slug` (derived,
-- and changed when name-normalization logic changed) instead of the stable
-- candidate id, which caused a second row to be created on every re-run
-- after a slug format change. Keep the row with more/equal contributions
-- (the newer, "clean-slug" row in every observed case) and drop the other;
-- contributions cascade-delete with it.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE("fecCandidateId", "coppCandidateId")
      ORDER BY "createdAt" DESC
    ) AS rn
  FROM "Politician"
  WHERE "fecCandidateId" IS NOT NULL OR "coppCandidateId" IS NOT NULL
)
DELETE FROM "Politician"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

-- AlterTable
CREATE UNIQUE INDEX "Politician_fecCandidateId_key" ON "Politician"("fecCandidateId");
CREATE UNIQUE INDEX "Politician_coppCandidateId_key" ON "Politician"("coppCandidateId");
