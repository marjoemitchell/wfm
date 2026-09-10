/**
 * One-off data migration: fetches FEC's `committee_type_full` (e.g. "Super
 * PAC (Independent Expenditure-Only)") for every already-ingested PAC/
 * committee donor that predates the `committeeType` column, without
 * re-running the full (multi-hour) `ingest-fec.ts` scrape just to backfill
 * one field.
 *
 * Usage: npx tsx scripts/backfill-committee-type.ts
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const API_KEY = process.env.FEC_API_KEY ?? "DEMO_KEY";
const BASE = "https://api.open.fec.gov/v1";

async function fetchCommitteeType(committeeId: string): Promise<string | null> {
  const url = new URL(`${BASE}/committee/${committeeId}/`);
  url.searchParams.set("api_key", API_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = (await res.json()) as { results: { committee_type_full: string | null }[] };
  return data.results[0]?.committee_type_full ?? null;
}

async function main() {
  const donors = await db.donor.findMany({
    where: { fecCommitteeId: { not: null }, committeeType: null },
    select: { id: true, name: true, fecCommitteeId: true },
  });
  console.log(`Found ${donors.length} donors missing committeeType.`);

  let updated = 0;
  let skipped = 0;

  for (const donor of donors) {
    try {
      const committeeType = await fetchCommitteeType(donor.fecCommitteeId!);
      if (committeeType) {
        await db.donor.update({ where: { id: donor.id }, data: { committeeType } });
        updated++;
        console.log(`  ${donor.name} -> ${committeeType}`);
      } else {
        console.log(`  ${donor.name} -> no committee_type_full returned, leaving null`);
      }
    } catch (err) {
      // Best-effort — a rate limit or a stale committee id shouldn't stop
      // the rest of the backfill. Re-running the script later will retry
      // whatever's still null.
      console.warn(`  skipped ${donor.name}:`, err instanceof Error ? err.message : err);
      skipped++;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nUpdated ${updated}, skipped ${skipped}, of ${donors.length} donors.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
