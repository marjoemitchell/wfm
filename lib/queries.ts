import { unstable_cache } from "next/cache";
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
): Promise<Map<string, { inStatePct: number; topSector: string | null; topSectorPct: number; itemizedTotal: number }>> {
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

  const result = new Map<string, { inStatePct: number; topSector: string | null; topSectorPct: number; itemizedTotal: number }>();
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
      topSectorPct: bucket.total > 0 && topAmount > 0 ? (topAmount / bucket.total) * 100 : 0,
      itemizedTotal: bucket.total,
    });
  }
  return result;
}

// Both cached: ingestion now only runs once a day (a Railway cron job),
// so there's no reason to recompute these full-table aggregations on
// every navigation between tabs — that was the dominant source of the
// site's page-to-page latency. getRosterStats() reuses getRoster({})'s
// already-cached rows instead of independently re-scanning every
// contribution a second time.
export const getRosterStats = unstable_cache(
  async () => {
    const [rows, donorCount] = await Promise.all([getRoster({}), db.donor.count()]);
    const trackedMoney = rows.reduce((sum, p) => sum + p.totalRaised, 0);
    const medianInState = median(rows.map((p) => p.inStatePct));

    return {
      officeholders: rows.length,
      trackedMoney,
      namedDonors: donorCount,
      medianInState,
    };
  },
  ["roster-stats"],
  { revalidate: 3600 }
);

async function getRosterUncached(params: { level?: string; sort?: RosterSort; query?: string }) {
  const level = params.level && params.level !== "All" ? LEVEL_MAP[params.level] : undefined;
  const query = params.query?.trim();
  // Match each word in the query independently against the name rather
  // than requiring the whole phrase as one contiguous substring — a plain
  // substring match on "Steve Daines" fails against a stored name like
  // "Steve D. Daines" or "Steven James Daines", since the middle name
  // breaks the contiguous match even though every word the user typed is
  // really there.
  const words = query ? query.split(/\s+/).filter(Boolean) : [];

  const politicians = await db.politician.findMany({
    where: {
      ...(level ? { level } : {}),
      ...(query
        ? {
            OR: [
              { AND: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })) },
              { office: { contains: query, mode: "insensitive" } },
              { contributions: { some: { donor: { sector: { contains: query, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    select: { id: true, slug: true, name: true, sortName: true, office: true, party: true, level: true, totalRaised: true },
  });

  const derived = await withInStatePct(politicians);

  // Support-only (never oppose) — this feeds an opt-in "include outside
  // spending" toggle that adds to a candidate's total, so only spending
  // that actually helped them belongs in it.
  const outsideSupport = await db.independentExpenditure.groupBy({
    by: ["politicianId"],
    where: { politicianId: { in: politicians.map((p) => p.id) }, support: true },
    _sum: { amount: true },
  });
  const outsideSupportById = new Map(outsideSupport.map((o) => [o.politicianId, toNumber(o._sum.amount ?? 0)]));

  const rows = politicians.map((p) => ({
    ...p,
    totalRaised: toNumber(p.totalRaised),
    inStatePct: derived.get(p.id)?.inStatePct ?? 0,
    topSector: derived.get(p.id)?.topSector ?? "Other / Unclassified",
    topSectorPct: derived.get(p.id)?.topSectorPct ?? 0,
    outsideSupport: outsideSupportById.get(p.id) ?? 0,
  }));

  const sort = params.sort ?? "raised";
  rows.sort((a, b) => {
    if (sort === "name") return a.sortName.localeCompare(b.sortName);
    if (sort === "instate") return b.inStatePct - a.inStatePct;
    return b.totalRaised - a.totalRaised;
  });

  return rows;
}

export const getRoster = unstable_cache(getRosterUncached, ["roster"], { revalidate: 3600 });

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

  // Independent expenditures (Super PAC spending) are never given to this
  // politician — they're a legally separate category (money a PAC spends
  // on its own, without coordinating with the campaign) — so they're kept
  // entirely out of itemizedTotal/pacPct/sectors/topDonors above, which
  // are all about money the campaign itself received.
  const independentExpenditures = await db.independentExpenditure.findMany({
    where: { politicianId: politician.id },
    select: { amount: true, support: true, donor: { select: { id: true, slug: true, name: true, city: true, state: true } } },
  });

  let supportTotal = 0;
  let opposeTotal = 0;
  const bySpender = new Map<string, { slug: string; name: string; city: string; state: string; support: number; oppose: number }>();
  for (const ie of independentExpenditures) {
    const amt = toNumber(ie.amount);
    if (ie.support) supportTotal += amt;
    else opposeTotal += amt;
    const existing = bySpender.get(ie.donor.id);
    if (existing) {
      if (ie.support) existing.support += amt;
      else existing.oppose += amt;
    } else {
      bySpender.set(ie.donor.id, {
        slug: ie.donor.slug,
        name: ie.donor.name,
        city: ie.donor.city,
        state: ie.donor.state,
        support: ie.support ? amt : 0,
        oppose: ie.support ? 0 : amt,
      });
    }
  }
  const outsideSpenders = [...bySpender.values()].sort((a, b) => b.support + b.oppose - (a.support + a.oppose));

  return {
    politician: { ...politician, totalRaised: toNumber(politician.totalRaised), cashOnHand: toNumber(politician.cashOnHand) },
    inStatePct: itemizedTotal > 0 ? (inState / itemizedTotal) * 100 : 0,
    pacPct: itemizedTotal > 0 ? (pacAmount / itemizedTotal) * 100 : 0,
    sectors,
    topDonors,
    outsideSpending: { supportTotal, opposeTotal, spenders: outsideSpenders },
  };
}

export async function getPoliticianSectorDonors(politicianSlug: string, sector: string) {
  const politician = await db.politician.findUnique({ where: { slug: politicianSlug }, select: { id: true, name: true } });
  if (!politician) return null;

  const contributions = await db.contribution.findMany({
    where: { politicianId: politician.id, donor: { sector } },
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

  return { politicianName: politician.name, sector, total, donorCount: donors.length, donors };
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

  // A pure independent-expenditure spender (a Super PAC with no direct
  // contributions at all) would otherwise render this page as empty —
  // "who they fund" is about contributions, which by law a Super PAC
  // can't make, so their support/opposition shows up here instead.
  const independentExpenditures = await db.independentExpenditure.findMany({
    where: { donorId: donor.id },
    select: {
      amount: true,
      date: true,
      support: true,
      description: true,
      payee: true,
      politician: { select: { slug: true, name: true, office: true, party: true } },
    },
    orderBy: { amount: "desc" },
  });
  const ieRows = independentExpenditures.map((ie) => ({
    politician: ie.politician,
    amount: toNumber(ie.amount),
    date: ie.date,
    support: ie.support,
    description: ie.description,
    payee: ie.payee,
  }));
  const ieTotal = ieRows.reduce((sum, r) => sum + r.amount, 0);
  const ieRecipients = new Set(ieRows.map((r) => r.politician.slug)).size;

  return {
    donor,
    rows,
    totalGiven,
    recipients,
    independentExpenditures: { total: ieTotal, recipients: ieRecipients, rows: ieRows },
  };
}

export const getIndustries = unstable_cache(
  async () => {
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
  },
  ["industries"],
  { revalidate: 3600 }
);

export const getOutsideSpenders = unstable_cache(
  async () => {
    const expenditures = await db.independentExpenditure.findMany({
      select: {
        amount: true,
        donor: { select: { id: true, slug: true, name: true } },
        politician: { select: { slug: true, name: true } },
      },
    });

    const byDonor = new Map<
      string,
      { slug: string; name: string; total: number; candidateSlugs: Set<string>; byCandidate: Map<string, { name: string; slug: string; amount: number }> }
    >();
    for (const ie of expenditures) {
      const amt = toNumber(ie.amount);
      const key = ie.donor.id;
      if (!byDonor.has(key)) {
        byDonor.set(key, { slug: ie.donor.slug, name: ie.donor.name, total: 0, candidateSlugs: new Set(), byCandidate: new Map() });
      }
      const bucket = byDonor.get(key)!;
      bucket.total += amt;
      bucket.candidateSlugs.add(ie.politician.slug);
      const existing = bucket.byCandidate.get(ie.politician.slug);
      if (existing) existing.amount += amt;
      else bucket.byCandidate.set(ie.politician.slug, { name: ie.politician.name, slug: ie.politician.slug, amount: amt });
    }

    const trackedTotal = [...byDonor.values()].reduce((sum, b) => sum + b.total, 0);

    const rows = [...byDonor.values()]
      .map((bucket) => {
        const topCandidate = [...bucket.byCandidate.values()].sort((a, b) => b.amount - a.amount)[0];
        return {
          slug: bucket.slug,
          name: bucket.name,
          total: bucket.total,
          share: trackedTotal > 0 ? (bucket.total / trackedTotal) * 100 : 0,
          candidateCount: bucket.candidateSlugs.size,
          topCandidate: topCandidate ? { name: topCandidate.name, slug: topCandidate.slug } : null,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { rows, trackedTotal };
  },
  ["outside-spenders"],
  { revalidate: 3600 }
);

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

// Cached (5 min) — identical for every visitor and only changes when an
// ingest run does, so there's no reason to re-scan all politicians on
// every keystroke-driven navigation in the compare picker.
export const getAllPoliticiansForPicker = unstable_cache(
  async () => {
    const politicians = await db.politician.findMany({
      select: { slug: true, name: true, sortName: true, office: true, party: true, totalRaised: true },
      orderBy: { sortName: "asc" },
    });
    return politicians.map((p) => ({ ...p, totalRaised: toNumber(p.totalRaised) }));
  },
  ["all-politicians-picker"],
  { revalidate: 300 }
);

const getMaxTotalRaised = unstable_cache(
  async () => {
    const result = await db.politician.aggregate({ _max: { totalRaised: true } });
    return toNumber(result._max.totalRaised ?? 0);
  },
  ["max-total-raised"],
  { revalidate: 300 }
);

// Cached per politician (5 min) — the compare page re-renders on every
// add/remove in the picker (it reads searchParams, so it can't be a
// purely static page), and without this, adding a 4th candidate redid
// the full contribution-aggregation for the 3 that hadn't changed too.
// Fetching thousands of contribution rows per candidate on every click
// was the actual source of the reported delay.
const getComparePoliticianCard = unstable_cache(
  async (slug: string) => {
    const p = await db.politician.findUnique({ where: { slug } });
    if (!p) return null;

    const rows = await db.contribution.findMany({
      where: { politicianId: p.id },
      select: { amount: true, isPac: true, donor: { select: { state: true, sector: true } } },
    });

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
      inStatePct: total > 0 ? (inState / total) * 100 : 0,
      pacPct: total > 0 ? (pac / total) * 100 : 0,
      outOfStatePct: total > 0 ? (outOfState / total) * 100 : 0,
      topSectors,
    };
  },
  ["compare-politician-card"],
  { revalidate: 300 }
);

export async function getComparePoliticians(slugs: string[]) {
  const [cards, maxRaised] = await Promise.all([
    Promise.all(slugs.map((slug) => getComparePoliticianCard(slug))),
    getMaxTotalRaised(),
  ]);

  return cards
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => ({ ...c, totalRaisedShare: maxRaised > 0 ? c.politician.totalRaised / maxRaised : 0 }))
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
