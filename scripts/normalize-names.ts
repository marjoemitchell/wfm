/**
 * One-off data migration: reparses each Politician's existing `name`
 * (still "LAST, FIRST ..." from the raw filings, ALL CAPS for FEC) into
 * a "First Last" display name + a "Last, First" sortName, and updates
 * the slug to match. Run once after the ingest scripts were updated to
 * produce this format natively — this fixes rows already in the
 * database without re-running the (multi-hour) scrapes.
 *
 * Usage: npx tsx scripts/normalize-names.ts
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseLastFirstName, slugify } from "../lib/format";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const politicians = await db.politician.findMany({ select: { id: true, name: true, slug: true } });
  console.log(`Found ${politicians.length} politicians.`);

  let updated = 0;
  let skipped = 0;

  for (const p of politicians) {
    const { display, sortName } = parseLastFirstName(p.name);
    if (display === p.name) continue;

    let slug = slugify(display);
    // Ingest jobs are running concurrently and inserting/renaming rows
    // live, so collisions must be checked against the database at write
    // time, not just against this script's own in-memory batch.
    let suffix = 2;
    for (;;) {
      const existing = await db.politician.findUnique({ where: { slug }, select: { id: true } });
      if (!existing || existing.id === p.id) break;
      slug = `${slugify(display)}-${suffix++}`;
    }

    try {
      await db.politician.update({ where: { id: p.id }, data: { name: display, sortName, slug } });
      updated++;
      console.log(`  ${p.name} -> ${display} (${slug})`);
    } catch (err) {
      // Another process touched this exact row between our read and
      // write (e.g. a concurrent ingest run reprocessing it) — safe to
      // skip, since that process applied an equivalent or newer update.
      console.warn(`  skipped ${p.name}:`, err instanceof Error ? err.message : err);
      skipped++;
    }
  }

  console.log(`\nUpdated ${updated}, skipped ${skipped}, of ${politicians.length} politicians.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
