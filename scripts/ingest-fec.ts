/**
 * Pulls Montana's federal candidates (US Senate + US House) and their
 * itemized Schedule A contributions from the OpenFEC API and loads them
 * as `source: FEC` Politicians/Donors/Contributions.
 *
 * Usage: npm run ingest:fec   (reads FEC_API_KEY, FEC_CYCLE, DATABASE_URL from .env)
 *
 * Safe to re-run: it replaces each candidate's existing FEC-sourced
 * contributions rather than appending to them.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { classifySector } from "./sector-crosswalk";
import { slugify, parseLastFirstName } from "../lib/format";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const API_KEY = process.env.FEC_API_KEY ?? "DEMO_KEY";
const CYCLE = Number(process.env.FEC_CYCLE ?? "2026");
const BASE = "https://api.open.fec.gov/v1";
const MAX_CONTRIBUTIONS_PER_COMMITTEE = 5000; // safety cap, especially under DEMO_KEY's tight rate limit

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fecGet<T>(path: string, params: Record<string, string | number | string[]>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      const wait = 2000 * (attempt + 1);
      console.warn(`Rate limited, waiting ${wait}ms...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      throw new Error(`FEC API ${res.status} for ${url.pathname}: ${await res.text()}`);
    }
    await sleep(250); // stay well under rate limits
    return (await res.json()) as T;
  }
  throw new Error(`FEC API rate-limited too many times for ${url.pathname}`);
}

type FecCandidate = {
  candidate_id: string;
  name: string;
  party: string;
  office: string;
  district: string | null;
};

type FecTotals = { cycle: number; receipts: number; cash_on_hand_end_period: number };
type FecCommittee = { committee_id: string; designation: string };

type FecScheduleARecord = {
  contributor_name: string | null;
  contributor_employer: string | null;
  contributor_occupation: string | null;
  contributor_city: string | null;
  contributor_state: string | null;
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
  entity_type: string | null;
  memo_code: string | null;
};

function partyCode(fecParty: string): "R" | "D" | "N" {
  if (fecParty === "REP") return "R";
  if (fecParty === "DEM") return "D";
  return "N";
}

function officeLabel(candidate: FecCandidate): string {
  if (candidate.office === "S") return "U.S. Senator";
  if (candidate.office === "H") {
    const district = candidate.district && candidate.district !== "00" ? candidate.district : null;
    return district ? `U.S. Representative, District ${Number(district)}` : "U.S. Representative";
  }
  return "U.S. Candidate";
}

function donorKey(name: string, employer: string | null, city: string, state: string): string {
  const hash = createHash("sha1").update(`${name}|${employer ?? ""}|${city}|${state}`).digest("hex").slice(0, 8);
  return `${slugify(name)}-${hash}`;
}

const donorIdCache = new Map<string, string>();

async function upsertDonor(record: FecScheduleARecord, isPac: boolean): Promise<string | null> {
  const name = record.contributor_name?.trim();
  if (!name) return null;
  const city = record.contributor_city?.trim() || "Unknown";
  const state = record.contributor_state?.trim() || "??";
  const employer = record.contributor_employer?.trim() || null;
  const occupation = record.contributor_occupation?.trim() || null;

  const key = donorKey(name, employer, city, state);
  const cached = donorIdCache.get(key);
  if (cached) return cached;

  const donor = await db.donor.upsert({
    where: { slug: key },
    create: {
      slug: key,
      name,
      employer,
      occupation,
      city,
      state,
      sector: isPac ? "Political Committees" : classifySector(employer, occupation),
    },
    update: {},
  });
  donorIdCache.set(key, donor.id);
  return donor.id;
}

async function ingestCandidate(candidate: FecCandidate) {
  console.log(`\n${candidate.name} (${candidate.candidate_id})`);

  const totalsRes = await fecGet<{ results: FecTotals[] }>(`/candidate/${candidate.candidate_id}/totals/`, { cycle: CYCLE });
  // Only an exact match for the target cycle counts — falling back to
  // whatever OpenFEC returns first would silently attribute a different
  // (often much older) election's fundraising totals to this cycle.
  const totals = totalsRes.results.find((t) => t.cycle === CYCLE);
  if (!totals) {
    console.warn(`  no totals for cycle ${CYCLE}, skipping`);
    return;
  }

  const committeesRes = await fecGet<{ results: FecCommittee[] }>(`/candidate/${candidate.candidate_id}/committees/`, { cycle: CYCLE });
  // Only the candidate's own committees — "P" (principal campaign
  // committee) and "A" (other authorized committee, e.g. a recount fund).
  // Excluding this let joint fundraising committees ("J") and other
  // linked-but-not-owned committees inflate the itemized total well past
  // the candidate's real totals.receipts figure (money raised by a JFC
  // isn't this candidate's money — it gets split across several
  // campaigns).
  const committeeIds = committeesRes.results
    .filter((c) => c.designation === "P" || c.designation === "A")
    .map((c) => c.committee_id);
  if (committeeIds.length === 0) {
    console.warn("  no committees found, skipping contributions");
  }

  const { display: name, sortName } = parseLastFirstName(candidate.name);
  const slug = slugify(name);
  const politician = await db.politician.upsert({
    // Keyed on the stable FEC candidate id, not the derived slug — the
    // slug changes whenever name-normalization logic changes, and keying
    // on it caused every re-run after such a change to create a second
    // row instead of updating the existing one.
    where: { fecCandidateId: candidate.candidate_id },
    create: {
      slug,
      name,
      sortName,
      office: officeLabel(candidate),
      level: "FEDERAL",
      party: partyCode(candidate.party),
      cycle: CYCLE,
      source: "FEC",
      fecCandidateId: candidate.candidate_id,
      totalRaised: totals.receipts ?? 0,
      cashOnHand: totals.cash_on_hand_end_period ?? 0,
    },
    update: {
      slug,
      name,
      sortName,
      office: officeLabel(candidate),
      party: partyCode(candidate.party),
      source: "FEC",
      totalRaised: totals.receipts ?? 0,
      cashOnHand: totals.cash_on_hand_end_period ?? 0,
    },
  });

  // Idempotent re-run: replace this politician's contributions.
  await db.contribution.deleteMany({ where: { politicianId: politician.id } });

  let totalContributions = 0;
  for (const committeeId of committeeIds) {
    let lastIndexes: { last_index?: string; last_contribution_receipt_date?: string } = {};

    while (totalContributions < MAX_CONTRIBUTIONS_PER_COMMITTEE) {
      const page = await fecGet<{ results: FecScheduleARecord[]; pagination: { last_indexes: typeof lastIndexes } }>(
        "/schedules/schedule_a/",
        {
          committee_id: committeeId,
          // `two_year_transaction_period` assigns records to FEC's filing
          // bucket for the committee, not by calendar date — verified
          // live that a Senate committee's 2023/2024 general-election
          // contributions still carry period=2026 years later. Explicit
          // min/max_date is what actually scopes this to real 2025-2026
          // activity.
          min_date: `${CYCLE - 1}-01-01`,
          max_date: `${CYCLE}-12-31`,
          per_page: 100,
          sort: "contribution_receipt_date",
          ...(lastIndexes.last_index ? { last_index: lastIndexes.last_index } : {}),
          ...(lastIndexes.last_contribution_receipt_date
            ? { last_contribution_receipt_date: lastIndexes.last_contribution_receipt_date }
            : {}),
        }
      );

      if (page.results.length === 0) break;

      const rows: { donorId: string; amount: number; date: Date; isPac: boolean }[] = [];
      for (const record of page.results) {
        // Conduit processors (WinRed, ActBlue) file a memo-coded Schedule A
        // line for every underlying small-dollar donor repeating the same
        // bundled transfer amount/date — informational only. Counting
        // those alongside the real transfer inflated some candidates'
        // itemized totals to 10-100x their actual FEC-reported receipts.
        if (record.memo_code) continue;
        const isPac = record.entity_type !== "IND";
        const donorId = await upsertDonor(record, isPac);
        if (!donorId || !record.contribution_receipt_amount) continue;
        rows.push({
          donorId,
          amount: record.contribution_receipt_amount,
          date: new Date(record.contribution_receipt_date),
          isPac,
        });
      }

      if (rows.length > 0) {
        await db.contribution.createMany({ data: rows.map((r) => ({ ...r, politicianId: politician.id })) });
        totalContributions += rows.length;
      }

      lastIndexes = page.pagination.last_indexes ?? {};
      if (!lastIndexes.last_index) break;
    }
  }

  console.log(`  ingested ${totalContributions} itemized contributions`);
}

// Fixed arbitrary key for this script's advisory lock. Prevents two
// overlapping runs (e.g. a Railway redeploy that doesn't instantly kill
// the previous job's process) from interleaving delete/insert cycles on
// the same candidate and leaving duplicated contribution rows behind —
// which happened in practice, twice.
const LOCK_KEY = 837462001;

async function main() {
  const [{ locked }] = await db.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked`;
  if (!locked) {
    console.error("Another ingest-fec run already holds the lock. Exiting without touching data.");
    process.exit(1);
  }

  console.log(`Ingesting Montana federal candidates for cycle ${CYCLE}...`);
  const candidatesRes = await fecGet<{ results: FecCandidate[] }>("/candidates/search/", {
    state: "MT",
    cycle: CYCLE,
    office: ["S", "H"],
    per_page: 100,
  });

  console.log(`Found ${candidatesRes.results.length} candidates.`);
  for (const candidate of candidatesRes.results) {
    // The Railway Postgres proxy occasionally drops a connection mid-run
    // (seen a handful of times across long ingestion runs) — one retry
    // clears it rather than silently leaving that candidate's data stale.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await ingestCandidate(candidate);
        break;
      } catch (err) {
        if (attempt === 2) {
          console.error(`  failed to ingest ${candidate.name}:`, err);
        } else {
          console.warn(`  ${candidate.name} failed, retrying once:`, err);
          await sleep(2000);
        }
      }
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$queryRaw`SELECT pg_advisory_unlock(${LOCK_KEY})`.catch(() => {});
    await db.$disconnect();
  });
