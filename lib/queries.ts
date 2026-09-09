import { db } from "@/lib/db";
import { toNumber, slugify } from "@/lib/format";
import type { Level } from "@/lib/generated/prisma/enums";

export type RosterSort = "raised" | "instate" | "name";

const LEVEL_MAP: Record<string, Level | undefined> = {
  Federal: "FEDERAL",
  Statewide: "STATEWIDE",
  Legislature: "LEGISLATURE",
  Judicial: "JUDICIAL",
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function withInStatePct<T extends { id: string; totalRaised: unknown }>(
  politicians: T[]
): Promise<Map<string, { inStatePct: number; topSector: string | null; itemizedTotal: number }>> {
  const ids = politicians.map((p) => p.id);
  const contributions = await db.contribution.findMany({
    where: { politicianId: { in: ids } },
    select: { politicianId: true, amount: true, donor: { select: { state: true, sector: true } } },
  });

  const byPolitician = new Map<string, { total: number; inState: number; bySector: Map<string, number> }>();
  for (const id of ids) byPolitician.set(id, { total: 0, inState: 0, bySector: new Map() });

  for (const c of contributions) {
    const bucket = byPolitician.get(c.politicianId)!;
    const amt = toNumber(c.amount);
    bucket.total += amt;
    if (c.donor.state === "MT") bucket.inState += amt;
    bucket.bySector.set(c.donor.sector, (bucket.bySector.get(c.donor.sector) ?? 0) + amt);
  }

  const result = new Map<string, { inStatePct: number; topSector: string | null; itemizedTotal: number }>();
  for (const [id, bucket] of byPolitician) {
    let topSector: string | null = null;
    let topAmount = -1;
    for (const [sector, amount] of bucket.bySector) {
      if (amount > topAmount) {
        topAmount = amount;
        topSector = sector;
      }
    }
    result.set(id, {
      inStatePct: bucket.total > 0 ? (bucket.inState / bucket.total) * 100 : 0,
      topSector,
      itemizedTotal: bucket.total,
    });
  }
  return result;
}

export async function getRosterStats() {
  const politicians = await db.politician.findMany({ select: { id: true, totalRaised: true } });
  const donorCount = await db.donor.count();
  const stats = await withInStatePct(politicians);
  const totalRaised = politicians.reduce((sum, p) => sum + toNumber(p.totalRaised), 0);
  const medianInState = median([...stats.values()].map((s) => s.inStatePct));

  return {
    officeholders: politicians.length,
    trackedMoney: totalRaised,
    namedDonors: donorCount,
    medianInState,
  };
}

export async function getRoster(params: { level?: string; sort?: RosterSort; query?: string }) {
  const level = params.level && params.level !== "All" ? LEVEL_MAP[params.level] : undefined;
  const query = params.query?.trim();

  const politicians = await db.politician.findMany({
    where: {
      ...(level ? { level } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { office: { contains: query, mode: "insensitive" } },
              { contributions: { some: { donor: { sector: { contains: query, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    select: { id: true, slug: true, name: true, sortName: true, office: true, party: true, level: true, totalRaised: true },
  });

  const derived = await withInStatePct(politicians);

  const rows = politicians.map((p) => ({
    ...p,
    totalRaised: toNumber(p.totalRaised),
    inStatePct: derived.get(p.id)?.inStatePct ?? 0,
    topSector: derived.get(p.id)?.topSector ?? "Other / Unclassified",
  }));

  const sort = params.sort ?? "raised";
  rows.sort((a, b) => {
    if (sort === "name") return a.sortName.localeCompare(b.sortName);
    if (sort === "instate") return b.inStatePct - a.inStatePct;
    return b.totalRaised - a.totalRaised;
  });

  return rows;
}

export async function getPoliticianBySlug(slug: string) {
  const politician = await db.politician.findUnique({ where: { slug } });
  if (!politician) return null;

  const contributions = await db.contribution.findMany({
    where: { politicianId: politician.id },
    select: { amount: true, isPac: true, donor: { select: { id: true, slug: true, name: true, employer: true, city: true, state: true, sector: true } } },
  });

  let itemizedTotal = 0;
  let inState = 0;
  let pacAmount = 0;
  const bySector = new Map<string, number>();
  const byDonor = new Map<string, { name: string; slug: string; employer: string | null; city: string; state: string; amount: number }>();

  for (const c of contributions) {
    const amt = toNumber(c.amount);
    itemizedTotal += amt;
    if (c.donor.state === "MT") inState += amt;
    if (c.isPac) pacAmount += amt;
    bySector.set(c.donor.sector, (bySector.get(c.donor.sector) ?? 0) + amt);

    const existing = byDonor.get(c.donor.id);
    if (existing) {
      existing.amount += amt;
    } else {
      byDonor.set(c.donor.id, {
        name: c.donor.name,
        slug: c.donor.slug,
        employer: c.donor.employer,
        city: c.donor.city,
        state: c.donor.state,
        amount: amt,
      });
    }
  }

  const sectors = [...bySector.entries()]
    .map(([name, amount]) => ({ name, amount, share: itemizedTotal > 0 ? (amount / itemizedTotal) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const topDonors = [...byDonor.values()].sort((a, b) => b.amount - a.amount).slice(0, 12);

  return {
    politician: { ...politician, totalRaised: toNumber(politician.totalRaised), cashOnHand: toNumber(politician.cashOnHand) },
    inStatePct: itemizedTotal > 0 ? (inState / itemizedTotal) * 100 : 0,
    pacPct: itemizedTotal > 0 ? (pacAmount / itemizedTotal) * 100 : 0,
    sectors,
    topDonors,
  };
}

export async function getPoliticianNameBySlug(slug: string) {
  return db.politician.findUnique({ where: { slug }, select: { slug: true, name: true } });
}

export async function getDonorBySlug(slug: string) {
  const donor = await db.donor.findUnique({ where: { slug } });
  if (!donor) return null;

  const contributions = await db.contribution.findMany({
    where: { donorId: donor.id },
    select: {
      amount: true,
      date: true,
      politician: { select: { slug: true, name: true, office: true, party: true } },
    },
    orderBy: { amount: "desc" },
  });

  const rows = contributions.map((c) => ({
    politician: c.politician,
    amount: toNumber(c.amount),
    date: c.date,
  }));

  const totalGiven = rows.reduce((sum, r) => sum + r.amount, 0);
  const recipients = new Set(rows.map((r) => r.politician.slug)).size;

  return { donor, rows, totalGiven, recipients };
}

export async function getIndustries() {
  const contributions = await db.contribution.findMany({
    select: {
      amount: true,
      donorId: true,
      donor: { select: { sector: true } },
      politician: { select: { slug: true, name: true } },
    },
  });

  const bySector = new Map<
    string,
    { total: number; donorIds: Set<string>; donorAmount: Map<string, { name: string; slug: string; amount: number }> }
  >();
  for (const c of contributions) {
    const sector = c.donor.sector;
    if (!bySector.has(sector)) bySector.set(sector, { total: 0, donorIds: new Set(), donorAmount: new Map() });
    const bucket = bySector.get(sector)!;
    const amt = toNumber(c.amount);
    bucket.total += amt;
    bucket.donorIds.add(c.donorId);
    const key = c.politician.slug;
    const existing = bucket.donorAmount.get(key);
    if (existing) existing.amount += amt;
    else bucket.donorAmount.set(key, { name: c.politician.name, slug: c.politician.slug, amount: amt });
  }

  const trackedTotal = [...bySector.values()].reduce((sum, b) => sum + b.total, 0);

  const rows = [...bySector.entries()]
    .map(([sector, bucket]) => {
      const topRecipient = [...bucket.donorAmount.values()].sort((a, b) => b.amount - a.amount)[0];
      return {
        sector,
        slug: slugify(sector),
        total: bucket.total,
        share: trackedTotal > 0 ? (bucket.total / trackedTotal) * 100 : 0,
        donorCount: bucket.donorIds.size,
        topRecipient: topRecipient ?? null,
      };
    })
    .sort((a, b) => b.total - a.total);

  return { rows, trackedTotal };
}

export async function getSectorBySlug(slug: string) {
  // Sector is a plain string on Donor, not its own model with a stored
  // slug — match by slugifying each distinct value rather than a WHERE.
  const distinctSectors = await db.donor.findMany({ distinct: ["sector"], select: { sector: true } });
  const sector = distinctSectors.map((d) => d.sector).find((s) => slugify(s) === slug);
  if (!sector) return null;

  const contributions = await db.contribution.findMany({
    where: { donor: { sector } },
    select: {
      amount: true,
      donor: { select: { id: true, slug: true, name: true, employer: true, city: true, state: true } },
    },
  });

  const byDonor = new Map<string, { slug: string; name: string; employer: string | null; city: string; state: string; amount: number }>();
  for (const c of contributions) {
    const amt = toNumber(c.amount);
    const existing = byDonor.get(c.donor.id);
    if (existing) existing.amount += amt;
    else
      byDonor.set(c.donor.id, {
        slug: c.donor.slug,
        name: c.donor.name,
        employer: c.donor.employer,
        city: c.donor.city,
        state: c.donor.state,
        amount: amt,
      });
  }

  const donors = [...byDonor.values()].sort((a, b) => b.amount - a.amount);
  const total = donors.reduce((sum, d) => sum + d.amount, 0);

  return { sector, total, donorCount: donors.length, donors };
}

export async function getAllPoliticiansForPicker() {
  const politicians = await db.politician.findMany({
    select: { slug: true, name: true, sortName: true, office: true, party: true, totalRaised: true },
    orderBy: { sortName: "asc" },
  });
  return politicians.map((p) => ({ ...p, totalRaised: toNumber(p.totalRaised) }));
}

export async function getComparePoliticians(slugs: string[]) {
  const politicians = await db.politician.findMany({ where: { slug: { in: slugs } } });
  const contributions = await db.contribution.findMany({
    where: { politicianId: { in: politicians.map((p) => p.id) } },
    select: { politicianId: true, amount: true, isPac: true, donor: { select: { state: true, sector: true } } },
  });

  const allPoliticiansMax = await db.politician.aggregate({ _max: { totalRaised: true } });
  const maxRaised = toNumber(allPoliticiansMax._max.totalRaised ?? 0);

  return politicians
    .map((p) => {
      const rows = contributions.filter((c) => c.politicianId === p.id);
      let total = 0;
      let inState = 0;
      let pac = 0;
      let outOfState = 0;
      const bySector = new Map<string, number>();
      for (const c of rows) {
        const amt = toNumber(c.amount);
        total += amt;
        if (c.donor.state === "MT") inState += amt;
        else outOfState += amt;
        if (c.isPac) pac += amt;
        bySector.set(c.donor.sector, (bySector.get(c.donor.sector) ?? 0) + amt);
      }
      const topSectors = [...bySector.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, amount]) => ({ name, amount }));

      return {
        politician: { ...p, totalRaised: toNumber(p.totalRaised), cashOnHand: toNumber(p.cashOnHand) },
        totalRaisedShare: maxRaised > 0 ? toNumber(p.totalRaised) / maxRaised : 0,
        inStatePct: total > 0 ? (inState / total) * 100 : 0,
        pacPct: total > 0 ? (pac / total) * 100 : 0,
        outOfStatePct: total > 0 ? (outOfState / total) * 100 : 0,
        topSectors,
      };
    })
    .sort((a, b) => slugs.indexOf(a.politician.slug) - slugs.indexOf(b.politician.slug));
}

const COMMITTEE_DOMINATED_THRESHOLD = 0.6;

// FEC city names come through as ALL CAPS; COPP's are mixed case. Without
// normalizing, "HELENA" and "Helena" show up as separate cities.
function normalizeCityName(city: string): string {
  return city
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (/\s+|-/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

export async function getMapData() {
  const contributions = await db.contribution.findMany({
    select: { amount: true, isPac: true, donor: { select: { city: true, state: true } } },
  });

  const montanaCityTotals = new Map<string, number>();
  const stateTotals = new Map<string, number>();
  const metroTotals = new Map<string, { city: string; state: string; amount: number; pacAmount: number }>();
  let inStateTotal = 0;
  let outOfStateTotal = 0;

  for (const c of contributions) {
    const amt = toNumber(c.amount);
    const state = c.donor.state;
    const city = normalizeCityName(c.donor.city);
    stateTotals.set(state, (stateTotals.get(state) ?? 0) + amt);

    if (state === "MT") {
      inStateTotal += amt;
      montanaCityTotals.set(city, (montanaCityTotals.get(city) ?? 0) + amt);
    } else {
      outOfStateTotal += amt;
      const key = `${city}|${state}`;
      const bucket = metroTotals.get(key) ?? { city, state, amount: 0, pacAmount: 0 };
      bucket.amount += amt;
      if (c.isPac) bucket.pacAmount += amt;
      metroTotals.set(key, bucket);
    }
  }

  const total = inStateTotal + outOfStateTotal;

  const topMetros = [...metroTotals.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((m) => ({
      city: m.city,
      state: m.state,
      amount: m.amount,
      committeeDominated: m.amount > 0 && m.pacAmount / m.amount >= COMMITTEE_DOMINATED_THRESHOLD,
    }));

  return {
    montanaCities: [...montanaCityTotals.entries()].map(([city, amount]) => ({ city, amount })),
    states: [...stateTotals.entries()].map(([state, amount]) => ({ state, amount })),
    topMetros,
    inStateTotal,
    outOfStateTotal,
    inStatePct: total > 0 ? (inStateTotal / total) * 100 : 0,
  };
}

export async function getDataProvenance() {
  const [latestFec, latestCopp] = await Promise.all([
    db.politician.findFirst({ where: { source: "FEC" }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    db.politician.findFirst({ where: { source: "MT_COPP" }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  return { fecUpdatedAt: latestFec?.updatedAt ?? null, coppUpdatedAt: latestCopp?.updatedAt ?? null };
}
