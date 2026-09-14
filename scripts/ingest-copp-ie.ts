/**
 * Pulls Montana independent-expenditure filings (Committee Finance Report
 * C-6, "Expenditures: Independent" section) from the Commissioner of
 * Political Practices' CERS portal and loads them as `source: MT_COPP`
 * IndependentExpenditure rows. Also pulls each spending committee's own
 * "Contributions" schedules (its Individual and Committee donor tables)
 * from the same reports and loads them as CommitteeFunding rows — this is
 * what lets a committee's disclosed funding be checked against its
 * spending later, rather than just recording the spending on its own.
 *
 * This only attaches expenditures to Politicians that ingest-copp.ts has
 * already created (matched by name/office/district parsed out of the
 * filing's free-text "Candidate/Issue" field) — it never creates new
 * Politicians itself, so run ingest-copp.ts first. Money aimed at a ballot
 * issue rather than a candidate, or naming a candidate we haven't ingested
 * (wrong cycle, local office, etc.), is skipped and counted in the summary.
 *
 * Both the independent-expenditure line items and the contribution
 * schedules come from the same `financeRepDetailList` DataTables JSON
 * endpoint the page's own JS calls for every schedule on the report,
 * distinguished only by a `listName` form field ("expendIndependent" for
 * the one this script already read, "individual" and "committee" for a
 * committee's own donors) — found by watching the network calls a real
 * "View Report" click makes, since the portal's search UI never exposes
 * those listName values itself. All three return the same line-item shape,
 * so no page rendering is needed for any of it.
 *
 * Usage: npm run ingest:copp-ie
 *
 * Safe to re-run: replaces the *entire* set of MT_COPP independent
 * expenditures and committee funding on each run (not just per-politician
 * or per-committee), so a committee that stops showing up in a search no
 * longer leaves stale rows behind.
 */
import "dotenv/config";
import { chromium, type Page } from "playwright";
import { PrismaClient, type Level } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "../lib/format";
import { createHash } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const BASE = "https://cers-ext.mt.gov/CampaignTracker/public";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generic paginator for this site's server-side jQuery DataTables grids:
// every grid takes the same iDisplayStart/iDisplayLength/mDataProp_N shape
// and returns { aaData, iTotalRecords }.
async function fetchAllRows<T>(page: Page, url: string, columnProps: string[], pageSize: number): Promise<T[]> {
  const out: T[] = [];
  let start = 0;
  while (true) {
    const qs = new URLSearchParams({
      sEcho: "1",
      iColumns: String(columnProps.length),
      sColumns: "",
      iDisplayStart: String(start),
      iDisplayLength: String(pageSize),
      sSearch: "",
      bRegex: "false",
      iSortCol_0: "1",
      sSortDir_0: "asc",
      iSortingCols: "1",
      _: String(Date.now()),
    });
    columnProps.forEach((prop, i) => {
      qs.set(`mDataProp_${i}`, prop);
      qs.set(`sSearch_${i}`, "");
      qs.set(`bRegex_${i}`, "false");
      qs.set(`bSearchable_${i}`, "true");
      qs.set(`bSortable_${i}`, i === 0 ? "false" : "true");
    });
    const res = await page.request.get(`${url}?${qs.toString()}`);
    const json: { aaData: T[]; iTotalRecords: number } = await res.json();
    out.push(...json.aaData);
    start += pageSize;
    if (start >= json.iTotalRecords) return out;
  }
}

type CommitteeRow = { committeeId: number; committeeName: string; committeeAddress: string; committeeTypeDescr: string };
type ReportRow = { reportId: number; fromDateStr: string; toDateStr: string; formTypeCode: string };
type IeItem = {
  totalAmt: number;
  entityName: string;
  entityAddress: string;
  datePaid: number;
  purposeDescr: string;
  candidateIssue: string;
};

// Same line-item shape the "individual" and "committee" listNames return —
// only entityName/entityAddress and lineItemCompositeDescr are used here.
// lineItemCompositeDescr is COPP's own label for the row ("Individual
// Contributions", "Independent Committee Contributions", "Incidental
// Committee Contributions", etc.) and becomes the funder's type verbatim,
// never a guess.
type FundingJsonItem = {
  totalAmt: number;
  entityName: string;
  entityAddress: string;
  datePaid: number;
  lineItemCompositeDescr: string;
};

type FundingItem = {
  funderName: string;
  funderCity: string;
  funderState: string;
  funderType: string;
  amount: number;
  date: Date;
};

function fundingItemsFromJson(items: FundingJsonItem[]): FundingItem[] {
  const out: FundingItem[] = [];
  for (const item of items) {
    if (!item.totalAmt) continue;
    const { city, state } = parseCommitteeAddress(item.entityAddress);
    out.push({
      funderName: item.entityName?.trim() || "Unknown",
      funderCity: city,
      funderState: state,
      funderType: item.lineItemCompositeDescr?.trim() || "Unknown",
      amount: item.totalAmt,
      date: new Date(item.datePaid),
    });
  }
  return out;
}

async function searchIndependentExpenditureCommittees(page: Page): Promise<CommitteeRow[]> {
  await page.goto(`${BASE}/search/searchCommitteeExpenditures`, { waitUntil: "networkidle" });
  await page.request.post(`${BASE}/searchResults/searchFinancials`, {
    form: {
      independentExpendSearch: "true",
      electioneeringCommSearch: "false",
      financialSearchType: "EXPEND",
      expendSearchTypeCode: "COMMITTEE",
      expendCanLastName: "",
      expendCanFirstName: "",
      expendCommitteeName: "",
      payeeLastName: "",
      payeeFirstName: "",
      expendPartyCode: "",
      expendCandidateTypeCode: "",
      expendOfficeCode: "",
      expendAmountRangeCode: "",
      electionYear: "",
      expendSearchFromDate: "",
      expendSearchToDate: "",
    },
  });
  return fetchAllRows<CommitteeRow>(
    page,
    `${BASE}/searchResults/listFinancialCommitteeResults`,
    ["checked", "committeeName", "electionYear", "committeeTypeDescr"],
    100
  );
}

async function fetchIndependentExpenditureItems(
  page: Page,
  committeeId: number
): Promise<{ items: IeItem[]; funding: FundingItem[] }> {
  await page.request.post(`${BASE}/publicReportList/retrieveCommitteeReports`, {
    form: { committeeId: String(committeeId), searchType: "", searchPage: "public" },
  });
  const reports = await fetchAllRows<ReportRow>(
    page,
    `${BASE}/publicReportList/listFinanceReports`,
    ["checked", "fromDateStr", "toDateStr", "formTypeDescr", "formTypeCode", "statusDescr"],
    50
  );

  // Keyed by period so a report superseded by a later amendment for the
  // same period (if the site ever returns both) doesn't get double-counted;
  // last one in wins.
  const c6ByPeriod = new Map<string, ReportRow>();
  for (const r of reports) {
    if (r.formTypeCode === "C6") c6ByPeriod.set(`${r.fromDateStr}-${r.toDateStr}`, r);
  }

  const items: IeItem[] = [];
  const funding: FundingItem[] = [];
  for (const report of c6ByPeriod.values()) {
    await page.request.post(`${BASE}/viewFinanceReport/retrieveReport`, {
      form: { committeeId: String(committeeId), candidateId: "", reportId: String(report.reportId), searchPage: "public" },
    });

    const [ieRes, individualRes, committeeRes] = await Promise.all([
      page.request.post(`${BASE}/viewFinanceReport/financeRepDetailList`, { form: { listName: "expendIndependent" } }),
      page.request.post(`${BASE}/viewFinanceReport/financeRepDetailList`, { form: { listName: "individual" } }),
      page.request.post(`${BASE}/viewFinanceReport/financeRepDetailList`, { form: { listName: "committee" } }),
    ]);
    items.push(...((await ieRes.json()) as IeItem[]));
    funding.push(...fundingItemsFromJson((await individualRes.json()) as FundingJsonItem[]));
    funding.push(...fundingItemsFromJson((await committeeRes.json()) as FundingJsonItem[]));
    await sleep(150);
  }
  return { items, funding };
}

// Committee mailing addresses come as a single "line1, City, ST ZIP"
// string (unlike the candidate-report tables ingest-copp.ts parses, which
// are HTML cells already split into lines); city/state are always the
// last two comma-separated segments regardless of how many address lines
// precede them.
function parseCommitteeAddress(address: string): { city: string; state: string } {
  const parts = (address ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return { city: "Unknown", state: "??" };
  const stateZip = parts[parts.length - 1];
  const city = parts[parts.length - 2] || "Unknown";
  const stateMatch = stateZip.match(/^([A-Za-z]{2})\b/);
  return { city, state: stateMatch ? stateMatch[1].toUpperCase() : "??" };
}

const donorIdCache = new Map<string, string>();

function donorKey(name: string, city: string, state: string): string {
  const hash = createHash("sha1").update(`${name}||${city}|${state}`).digest("hex").slice(0, 8);
  return `${slugify(name)}-${hash}`;
}

async function upsertCommitteeDonor(committeeName: string, committeeAddress: string): Promise<string | null> {
  const name = committeeName?.trim();
  if (!name) return null;
  const { city, state } = parseCommitteeAddress(committeeAddress);
  const key = donorKey(name, city, state);
  const cached = donorIdCache.get(key);
  if (cached) return cached;

  const donor = await db.donor.upsert({
    where: { slug: key },
    create: { slug: key, name, city, state, sector: "Political Committees" },
    update: {},
  });
  donorIdCache.set(key, donor.id);
  return donor.id;
}

type MatchablePolitician = { id: string; name: string; office: string; level: Level };

// Filings name the target in free text, in three shapes seen live on the
// site: "Candidate Zack Wirth SD9" (full name + district), "Rep. Jane
// Gillette" (title + full name, no district), and "Buttery SD11" (bare
// surname + district — several committees only ever give a last name).
// Titles are stripped first; a trailing "SD#"/"HD#" is then peeled off and,
// when present, used to narrow the match to that exact district's
// Politician before comparing names — without it, a bare surname like
// "Buttery" would be unresolvable (and a full name is matched directly).
const TITLE_RE =
  /^(candidate|rep\.?|representative|sen\.?|senator|governor|lt\.?\s*governor|lieutenant governor|judge|justice|mr\.?|mrs\.?|ms\.?|dr\.?)\s+/i;
const DISTRICT_RE = /\s*(SD|HD)\s*(\d+)\.?\s*$/i;

function parseCandidateIssueEntry(raw: string): { namePart: string; chamber: "SD" | "HD" | null; district: number | null } {
  let s = raw.trim().replace(/["']/g, "");
  let stripped: RegExpExecArray | null;
  while ((stripped = TITLE_RE.exec(s))) s = s.slice(stripped[0].length);

  const dm = DISTRICT_RE.exec(s);
  if (!dm) return { namePart: s.trim(), chamber: null, district: null };
  return { namePart: s.slice(0, dm.index).trim(), chamber: dm[1].toUpperCase() as "SD" | "HD", district: Number(dm[2]) };
}

function findPolitician(entry: string, politicians: MatchablePolitician[]): MatchablePolitician | null {
  const { namePart, chamber, district } = parseCandidateIssueEntry(entry);
  if (!namePart) return null;
  const lowerName = namePart.toLowerCase();

  if (chamber && district != null) {
    const officeLabel = chamber === "SD" ? `Senate District No. ${district}` : `House District No. ${district}`;
    const pool = politicians.filter((p) => p.level === "LEGISLATURE" && p.office === officeLabel);
    const exact = pool.find((p) => p.name.toLowerCase() === lowerName);
    if (exact) return exact;
    // Bare surname (no space): only usable if it's unambiguous within this
    // specific district's candidates.
    if (!lowerName.includes(" ")) {
      const bySurname = pool.filter((p) => p.name.toLowerCase().split(" ").pop() === lowerName);
      return bySurname.length === 1 ? bySurname[0] : null;
    }
    return null;
  }

  return politicians.find((p) => p.name.toLowerCase() === lowerName) ?? null;
}

// A single line item sometimes covers several candidates at once (one
// committee mailer touching three races), e.g. candidateIssue
// "Jones SD9; Warden HD13" with purpose "(...Jones SD9 $4087.85)
// (...Warden HD13 $2570.10)". The per-candidate dollar figures are only
// trustworthy when there's exactly one $amount per named candidate and
// they sum back to the filed total; otherwise there's no reliable way to
// apportion the total, so the whole line item is skipped rather than
// guessing (attributing the full amount to each, or splitting evenly,
// would fabricate numbers on a public finance dataset).
function splitEntries(candidateIssueRaw: string, purposeDescr: string, totalAmt: number): { entry: string; amount: number; text: string }[] {
  const entries = candidateIssueRaw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (entries.length <= 1) return entries.map((entry) => ({ entry, amount: totalAmt, text: purposeDescr }));

  const dollarAmounts = [...purposeDescr.matchAll(/\$([\d,]+\.\d{2})/g)].map((m) => Number(m[1].replace(/,/g, "")));
  if (dollarAmounts.length !== entries.length) return [];
  if (Math.abs(dollarAmounts.reduce((a, b) => a + b, 0) - totalAmt) > 0.02) return [];

  // Prefer "(...) (...) (...)" parenthetical clauses for per-candidate
  // sentiment text; fall back to splitting on the same separator the
  // candidate list itself used; otherwise every candidate shares the full
  // description (better than nothing for the support/oppose guess below).
  const parenClauses = [...purposeDescr.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
  const semicolonClauses = purposeDescr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const texts =
    parenClauses.length === entries.length ? parenClauses : semicolonClauses.length === entries.length ? semicolonClauses : null;

  return entries.map((entry, i) => ({ entry, amount: dollarAmounts[i], text: texts ? texts[i] : purposeDescr }));
}

// Montana's C-6 independent-expenditure grid has no structured
// support/oppose field at all (confirmed against the live API response
// shape) — filers only narrate it in free text. Beyond direct sentiment
// words, this also catches the "explaining/exposing a candidate's vote on
// X" and "voting record" framing that this dataset's attack-style
// committees use almost exclusively instead of ever saying "oppose" (a
// candidate's own supportive spending describes them directly — it never
// narrates a third party's vote), plus a "(No <Name>, ...)" scorecard
// shorthand seen in multi-candidate line items. "vote for" is deliberately
// NOT treated as a support cue: in this corpus it almost always continues
// "...vote for [some spending/policy]" (attack framing), not "vote for
// [candidate]" (the classic GOTV phrasing it would suggest). Text with
// none of these cues defaults to support and is counted separately below
// so the gap is visible rather than silently wrong.
const OPPOSE_RE =
  /\b(oppose[sd]?|opposing|against|defeat(?:ing)?|attack(?:ing)?|expos(?:e|ing)|reject|no on|vote no|negative|voting record|voted to (?:send|fund)|votes? to raise|conflict of interest)\b/i;
const OPPOSE_NARRATIVE_RE = /\bexplain(?:s|ing|ed)?\b[^.]{0,60}\bvotes?\b/i;
const OPPOSE_SCORECARD_RE = /(^|\()\s*no\s+[a-z]/i;
const SUPPORT_RE = /\b(support(?:ing)?|endorse[sd]?|endorsing|back(?:ing)?|elect|re-?elect|positive|in favor)\b/i;

function inferSupport(text: string): { support: boolean; explicit: boolean } {
  if (OPPOSE_RE.test(text) || OPPOSE_NARRATIVE_RE.test(text) || OPPOSE_SCORECARD_RE.test(text)) return { support: false, explicit: true };
  if (SUPPORT_RE.test(text)) return { support: true, explicit: true };
  return { support: true, explicit: false };
}

const LOCK_KEY = 837462003;

async function main() {
  const [{ locked }] = await db.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked`;
  if (!locked) {
    console.error("Another ingest-copp-ie run already holds the lock. Exiting without touching data.");
    process.exit(1);
  }

  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  console.log("Searching for committees with independent-expenditure filings...");
  const committees = await searchIndependentExpenditureCommittees(page);
  console.log(`Found ${committees.length} committees.`);

  const politicians = await db.politician.findMany({
    where: { source: "MT_COPP" },
    select: { id: true, name: true, office: true, level: true },
  });

  const rows: {
    politicianId: string;
    donorId: string;
    amount: number;
    date: Date;
    support: boolean | null;
    description: string | null;
    payee: string | null;
  }[] = [];
  const fundingRows: {
    committeeId: string;
    funderName: string;
    funderCity: string;
    funderState: string;
    funderType: string;
    amount: number;
    date: Date;
  }[] = [];
  const processedDonorIds = new Set<string>();
  let itemCount = 0;
  let noTarget = 0;
  let noTargetAmt = 0;
  let noMatch = 0;
  let noMatchAmt = 0;
  let unresolvedSplit = 0;
  let unresolvedSplitAmt = 0;
  let unclearDirection = 0;
  let unclearDirectionAmt = 0;

  for (const [i, committee] of committees.entries()) {
    try {
      const donorId = await upsertCommitteeDonor(committee.committeeName, committee.committeeAddress);
      if (!donorId) continue;
      processedDonorIds.add(donorId);

      const { items, funding } = await fetchIndependentExpenditureItems(page, committee.committeeId);
      for (const f of funding) {
        fundingRows.push({ committeeId: donorId, ...f });
      }
      for (const item of items) {
        const totalAmt = item.totalAmt;
        if (!totalAmt) continue;
        itemCount++;

        const candidateIssueRaw = (item.candidateIssue ?? "").trim();
        if (!candidateIssueRaw) {
          noTarget++;
          noTargetAmt += totalAmt;
          continue;
        }

        const parts = splitEntries(candidateIssueRaw, item.purposeDescr ?? "", totalAmt);
        if (parts.length === 0) {
          unresolvedSplit++;
          unresolvedSplitAmt += totalAmt;
          console.warn(`  unresolved multi-candidate split for "${committee.committeeName}": "${candidateIssueRaw}" ($${totalAmt})`);
          continue;
        }

        for (const part of parts) {
          const politician = findPolitician(part.entry, politicians);
          if (!politician) {
            noMatch++;
            noMatchAmt += part.amount;
            continue;
          }
          const { support, explicit } = inferSupport(part.text);
          if (!explicit) {
            unclearDirection++;
            unclearDirectionAmt += part.amount;
          }
          rows.push({
            politicianId: politician.id,
            donorId,
            amount: part.amount,
            date: new Date(item.datePaid),
            // Only store a direction we actually found language for; a
            // guess with no real signal is worse than admitting we don't
            // know (see inferSupport's own comment for why keyword
            // detection alone can't be trusted further than this).
            support: explicit ? support : null,
            description: item.purposeDescr?.trim() || null,
            payee: item.entityName?.trim() || null,
          });
        }
      }
    } catch (err) {
      console.error(`  ${committee.committeeName} failed:`, err);
    }
    if ((i + 1) % 25 === 0) console.log(`  ...${i + 1}/${committees.length} committees checked`);
  }

  console.log(`\nParsed ${itemCount} independent-expenditure line items.`);
  console.log(`  no candidate/issue named: ${noTarget} items, $${noTargetAmt.toFixed(0)}`);
  console.log(`  named target not found among ingested candidates: ${noMatch} items, $${noMatchAmt.toFixed(0)}`);
  console.log(`  multi-candidate line item, couldn't verify split: ${unresolvedSplit} items, $${unresolvedSplitAmt.toFixed(0)}`);
  console.log(`  direction unclear (no explicit support/oppose language): ${unclearDirection} of ${rows.length} matched rows, $${unclearDirectionAmt.toFixed(0)}`);
  console.log(`\nParsed ${fundingRows.length} committee funding rows across ${processedDonorIds.size} committees.`);

  await db.$transaction([
    db.independentExpenditure.deleteMany({ where: { politicianId: { in: politicians.map((p) => p.id) } } }),
    ...(rows.length ? [db.independentExpenditure.createMany({ data: rows })] : []),
    db.committeeFunding.deleteMany({ where: { committeeId: { in: [...processedDonorIds] } } }),
    ...(fundingRows.length ? [db.committeeFunding.createMany({ data: fundingRows })] : []),
  ]);

  console.log(`\nDone. Wrote ${rows.length} independent expenditures across ${new Set(rows.map((r) => r.politicianId)).size} politicians.`);
  console.log(`Wrote ${fundingRows.length} committee funding rows across ${new Set(fundingRows.map((f) => f.committeeId)).size} committees.`);
  await browser.close();
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
