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

  const seenSlugs = new Map<string, number>();
  let updated = 0;

  for (const p of politicians) {
    const { display, sortName } = parseLastFirstName(p.name);
    let slug = slugify(display);
    const collisionCount = seenSlugs.get(slug) ?? 0;
    seenSlugs.set(slug, collisionCount + 1);
    if (collisionCount > 0) slug = `${slug}-${collisionCount + 1}`;

    if (display === p.name && slug === p.slug) continue;

    await db.politician.update({
      where: { id: p.id },
      data: { name: display, sortName, slug },
    });
    updated++;
    console.log(`  ${p.name} -> ${display} (${slug})`);
  }

  console.log(`\nUpdated ${updated} of ${politicians.length} politicians.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
