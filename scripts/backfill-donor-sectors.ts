/**
 * One-off backfill for donors that predate the TypeSafe sector fallback.
 * ingest-fec.ts/ingest-copp.ts only classify a donor once, at creation
 * (see upsertDonor), so a donor already in the database as
 * UNCLASSIFIED_SECTOR never gets reclassified just by re-running ingest.
 * This walks every such donor through classifySectorWithFallback once and
 * writes back whatever it lands on.
 *
 * Usage:
 *   npm run backfill:sectors -- --dry-run          preview only, no writes
 *   npm run backfill:sectors -- --limit=50          process only the first N
 *   npm run backfill:sectors                        the real thing
 *
 * Safe to re-run: any donor a previous run already moved out of
 * UNCLASSIFIED_SECTOR is no longer in the query, and a donor left there
 * (TypeSafe still said "no fit") just gets tried again.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { classifySectorWithFallback } from "./sector-classifier";
import { UNCLASSIFIED_SECTOR } from "./sector-crosswalk";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : undefined;
const CONCURRENCY = 8;

// Simple fixed-size worker pool: classifySectorWithFallback's own cache
// already de-dupes identical employer/occupation pairs, so this mainly
// buys wall-clock time on the distinct ones.
async function runPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}

async function main() {
  if (!process.env.TYPESAFE_API_KEY) {
    console.error("TYPESAFE_API_KEY is not set; nothing for this backfill to do.");
    process.exit(1);
  }

  const donors = await db.donor.findMany({
    where: { sector: UNCLASSIFIED_SECTOR, OR: [{ employer: { not: null } }, { occupation: { not: null } }] },
    select: { id: true, name: true, employer: true, occupation: true },
    ...(LIMIT ? { take: LIMIT } : {}),
  });
  console.log(`${DRY_RUN ? "[dry run] " : ""}Backfilling ${donors.length} donors currently in "${UNCLASSIFIED_SECTOR}"...`);

  let reclassified = 0;
  let stillUnclassified = 0;
  let lowConfidence = 0;
  let done = 0;

  await runPool(donors, CONCURRENCY, async (donor) => {
    const { sector, confidence } = await classifySectorWithFallback(donor.employer, donor.occupation);
    done++;
    if (sector === UNCLASSIFIED_SECTOR) {
      stillUnclassified++;
    } else {
      reclassified++;
      if (confidence !== null && confidence < 0.7) {
        lowConfidence++;
        console.log(`  [low confidence ${confidence.toFixed(2)}] ${donor.name} (${donor.employer ?? "none"} / ${donor.occupation ?? "none"}) -> ${sector}`);
      }
      if (!DRY_RUN) {
        await db.donor.update({ where: { id: donor.id }, data: { sector, sectorConfidence: confidence } });
      }
    }
    if (done % 200 === 0) console.log(`  ...${done} of ${donors.length} processed`);
  });

  console.log(
    `\nDone. Reclassified: ${reclassified}, still unclassified: ${stillUnclassified}, of which low confidence (<0.7): ${lowConfidence}.`
  );
  if (DRY_RUN) console.log("Dry run: no rows were written.");
  await db.$disconnect();
}

main();
