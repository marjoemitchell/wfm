/**
 * Pulls real Montana Statewide, Legislature, and Judicial campaign finance
 * data from the Commissioner of Political Practices' public CERS portal
 * (cers-ext.mt.gov/CampaignTracker) — there is no API, so this drives a
 * headless browser through the same search/report-viewer flow a person
 * would use.
 *
 * One-time local setup: `npx playwright install chromium`
 * Usage: npm run ingest:copp
 *
 * Election-year mapping (COPP's calendar differs from FEC's single cycle):
 *  - Legislature (House/Senate, 2-year terms): 2026, matching the site's
 *    own "2026 cycle" framing.
 *  - Statewide (Governor, Lt. Gov, AG, SoS, Auditor, Superintendent — all
 *    elected together every 4 years): 2024, their current term's election.
 *  - Judicial (Supreme Court 8-year / District Judge 6-year staggered
 *    terms): tries 2024, then 2022, then 2020 per seat, stopping at the
 *    first year with any candidates. Best-effort — a seat whose last
 *    election falls outside that window won't be found.
 *
 * Safe to re-run: replaces each politician's contributions on each run.
 */
import "dotenv/config";
import { chromium, type Page } from "playwright";
import { PrismaClient, type Level, type Party } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { classifySector } from "./sector-crosswalk";
import { slugify } from "../lib/format";
import { createHash } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const BASE = "https://cers-ext.mt.gov/CampaignTracker/public/search/candidateSearch";
const MAX_REPORTS_PER_CANDIDATE = 20;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STATEWIDE_OFFICES = new Set([
  "Governor",
  "Lieutenant Governor",
  "Attorney General",
  "Secretary of State",
  "State Auditor",
  "Superintendent of Public Instruction",
]);

function levelForOfficeLabel(label: string): Level | null {
  if (STATEWIDE_OFFICES.has(label)) return "STATEWIDE";
  if (/^House District No\.|^Senate District No\./.test(label)) return "LEGISLATURE";
  if (/^Supreme Court|^District Judge/.test(label)) return "JUDICIAL";
  return null;
}

function yearsForLevel(level: Level): number[] {
  if (level === "LEGISLATURE") return [2026];
  if (level === "STATEWIDE") return [2024];
  return [2024, 2022, 2020]; // JUDICIAL: best-effort staggered-term scan
}

function partyCode(label: string): Party {
  const l = label.toLowerCase();
  if (l.includes("republican")) return "R";
  if (l.includes("democrat")) return "D";
  return "N";
}

function parseMoney(text: string): number {
  const n = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

type OfficeOption = { value: string; label: string; level: Level };

async function getRelevantOffices(page: Page): Promise<OfficeOption[]> {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const options = await page
    .locator("#officeCode option")
    .evaluateAll((els) => els.map((e) => ({ value: (e as HTMLOptionElement).value, label: e.textContent?.trim() ?? "" })));
  const relevant: OfficeOption[] = [];
  for (const o of options) {
    if (!o.value) continue;
    const level = levelForOfficeLabel(o.label);
    if (level) relevant.push({ value: o.value, label: o.label, level });
  }
  return relevant;
}

type CandidateRow = { id: string; name: string; office: string; county: string };

async function searchCandidates(page: Page, officeValue: string, year: number): Promise<CandidateRow[]> {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.selectOption("#officeCode", officeValue);
  await page.fill("input[name='electionYear']", String(year));
  await page.locator("button:has-text('Search Candidate'), input[value='Search Candidate']").first().click();
  await page.waitForLoadState("networkidle").catch(() => {});

  const bodyText = await page.locator("table").first().innerText().catch(() => "");
  if (/No data available/i.test(bodyText)) return [];

  const rows = await page.locator("table").first().locator("tbody tr").all();
  const out: CandidateRow[] = [];
  for (const row of rows) {
    const checkboxValue = await row.locator("input.ace").first().getAttribute("value").catch(() => null);
    if (!checkboxValue) continue;
    const tds = await row.locator("td").allInnerTexts();
    out.push({
      id: checkboxValue,
      name: tds[1]?.trim() ?? "",
      office: tds[7]?.trim() ?? "",
      county: tds[8]?.trim() ?? "",
    });
  }
  return out;
}

async function getParty(page: Page, officeValue: string, year: number, candidateId: string): Promise<Party> {
  try {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.selectOption("#officeCode", officeValue);
    await page.fill("input[name='electionYear']", String(year));
    await page.locator("button:has-text('Search Candidate'), input[value='Search Candidate']").first().click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.locator(`input.ace[value='${candidateId}']`).check();
    await page.locator("#viewCandidateButton").click();
    await page.waitForLoadState("networkidle").catch(() => {});
    const text = await page.locator("body").innerText();
    const match = text.match(/Party[:\s]+([A-Za-z ]+)/i);
    if (match) return partyCode(match[1]);
  } catch {
    // fall through to default below
  }
  return "N";
}

type TableCell = string;
type ExtractedTable = { headers: TableCell[]; rows: TableCell[][] };

// NOTE: this callback is serialized (via .toString()) and run inside the
// browser page, in total isolation from this file's module scope — no
// helper functions, no closures over outer variables, nothing but plain
// browser globals. tsx/esbuild can otherwise wrap even a top-level nested
// `function` declaration here with a `__name(...)` call that references a
// helper which doesn't exist in that isolated context, throwing
// "ReferenceError: __name is not defined". Every step of the extraction is
// inlined below for that reason — do not factor any part of this back out
// into a named function.
async function extractTables(page: Page): Promise<ExtractedTable[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("table")).map((table) => {
      const headerRow = table.querySelector("thead tr") || table.querySelector("tr");
      const headers = headerRow ? Array.from(headerRow.querySelectorAll("th,td")).map((c) => c.textContent?.trim() ?? "") : [];
      const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
        Array.from(tr.querySelectorAll("td")).map((td) =>
          (td.innerHTML || "")
            .split(/<br\s*\/?>/i)
            .map((s) => s.replace(/<[^>]+>/g, "").trim())
            .filter(Boolean)
            .join(" | ")
        )
      );
      return { headers, rows };
    });
  });
}

type RawContribution = {
  entityLines: string[];
  employerLines: string[];
  amount: number;
  isPac: boolean;
  date: Date;
};

function parseEntity(entityCell: string): { name: string; city: string; state: string } {
  const lines = entityCell.split(" | ").filter(Boolean);
  const name = lines[0] ?? "Unknown";
  const rest = lines.slice(1).join(" ");
  const match = rest.match(/,\s*([A-Za-z .'-]+?)\s*,\s*([A-Z]{2})\s*\d{0,5}\s*$/);
  return { name, city: match?.[1]?.trim() ?? "Unknown", state: match?.[2] ?? "MT" };
}

function parseEmployerOccupation(cell: string): { employer: string | null; occupation: string | null } {
  const parts = cell.split(" | ").filter(Boolean);
  return { employer: parts[0] || null, occupation: parts[1] || parts[0] || null };
}

function tablesToContributions(
  tables: ExtractedTable[],
  fallbackDate: Date
): { contributions: RawContribution[]; periodReceipts: number; endingCash: number | null } {
  const contributions: RawContribution[] = [];
  let periodReceipts = 0;
  let endingCash: number | null = null;

  for (const table of tables) {
    const headers = table.headers;
    const hasEntity = headers.includes("Entity");
    const hasEmployer = headers.includes("Employer");
    const hasCommitteeType = headers.includes("Committee Type");
    const hasCashCheck = headers.includes("Cash/Check Amount");
    const hasInKind = headers.includes("In-Kind Value");

    if (headers[0]?.startsWith("Cash Summary")) {
      for (const row of table.rows) {
        const label = row[0] ?? "";
        const nums = row.slice(2).map(parseMoney);
        const sum = nums.reduce((a, b) => a + b, 0);
        if (/receipts.*received/i.test(label)) periodReceipts += sum;
        if (/cash.*end|ending.*cash|cash on hand/i.test(label)) endingCash = sum;
      }
      continue;
    }

    if (!hasEntity || !hasCashCheck || !(hasEmployer || hasCommitteeType) || !hasInKind) continue;

    const entityIdx = headers.indexOf("Entity");
    const employerIdx = headers.indexOf("Employer");
    const inKindIdx = headers.indexOf("In-Kind Value");
    const cashIdx = headers.indexOf("Cash/Check Amount");
    const dateIdx = headers.indexOf("Date");

    for (const row of table.rows) {
      const entityCell = row[entityIdx] ?? "";
      if (!entityCell) continue;
      const cash = parseMoney(row[cashIdx] ?? "0");
      const inKind = parseMoney(row[inKindIdx] ?? "0");
      const amount = cash || inKind;
      if (!amount) continue;
      const parsedDate = dateIdx >= 0 ? new Date(row[dateIdx] ?? "") : null;
      contributions.push({
        entityLines: entityCell.split(" | ").filter(Boolean),
        employerLines: hasEmployer && employerIdx >= 0 ? (row[employerIdx] ?? "").split(" | ").filter(Boolean) : [],
        amount,
        isPac: hasCommitteeType,
        date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : fallbackDate,
      });
    }
  }

  return { contributions, periodReceipts, endingCash };
}

// MM/DD/YYYY -> a real sortable Date (string sort puts month before year,
// so e.g. "09/05/2025" would lexically outrank "03/05/2026").
function parseUsDate(s: string): Date {
  const [m, d, y] = s.split("/").map(Number);
  return new Date(y || 0, (m || 1) - 1, d || 1);
}

async function goToCandidateReportList(page: Page, officeValue: string, year: number, candidateId: string): Promise<boolean> {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.selectOption("#officeCode", officeValue);
  await page.fill("input[name='electionYear']", String(year));
  await page.locator("button:has-text('Search Candidate'), input[value='Search Candidate']").first().click();
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator(`input.ace[value='${candidateId}']`).check();
  await page.locator("#candidateReportButton").click();
  await page.waitForLoadState("networkidle").catch(() => {});
  const reportBodyText = await page.locator("table").first().innerText().catch(() => "");
  return !/No data available/i.test(reportBodyText);
}

async function processCandidateFinancials(
  page: Page,
  officeValue: string,
  year: number,
  candidateId: string
): Promise<{ contributions: RawContribution[]; totalRaised: number; cashOnHand: number }> {
  const hasReports = await goToCandidateReportList(page, officeValue, year, candidateId);
  if (!hasReports) return { contributions: [], totalRaised: 0, cashOnHand: 0 };

  const reportRows = await page.locator("table").first().locator("tbody tr").all();
  const reports: { checkboxValue: string; from: string; to: string; type: string }[] = [];
  const seenPeriods = new Set<string>();
  for (const row of reportRows.slice(0, MAX_REPORTS_PER_CANDIDATE)) {
    const checkboxValue = await row.locator("input.ace").first().getAttribute("value").catch(() => null);
    const tds = await row.locator("td").allInnerTexts();
    const [, from, to, , type] = tds;
    if (!checkboxValue || type?.trim() !== "C5") continue;
    const key = `${from?.trim()}-${to?.trim()}`;
    if (seenPeriods.has(key)) continue;
    seenPeriods.add(key);
    reports.push({ checkboxValue, from: from?.trim() ?? "", to: to?.trim() ?? "", type: type?.trim() ?? "" });
  }
  // Most recent period first, so the first successfully-read ending cash wins.
  reports.sort((a, b) => parseUsDate(b.to).getTime() - parseUsDate(a.to).getTime());

  const allContributions: RawContribution[] = [];
  let totalRaised = 0;
  let cashOnHand = 0;
  let gotCashOnHand = false;

  // Each report is a fresh navigation back through the search -> candidate
  // -> report-list flow rather than page.goBack() — back-navigation on this
  // site doesn't reliably restore the interactive report-list state, which
  // left every report after the first timing out during testing.
  for (const [index, report] of reports.entries()) {
    try {
      if (index > 0) await goToCandidateReportList(page, officeValue, year, candidateId);
      await page.locator(`input.ace[value='${report.checkboxValue}']`).check();
      await page.locator("#viewReportButton").click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await sleep(300); // let client-side rendering of the report tables settle
      const tables = await extractTables(page);
      const fallbackDate = parseUsDate(report.to);
      const { contributions, periodReceipts, endingCash } = tablesToContributions(tables, fallbackDate);
      allContributions.push(...contributions);
      totalRaised += periodReceipts;
      if (!gotCashOnHand && endingCash !== null) {
        cashOnHand = endingCash;
        gotCashOnHand = true;
      }
      await sleep(200);
    } catch (err) {
      console.warn(`    report ${report.from}-${report.to} failed:`, err);
    }
  }

  return { contributions: allContributions, totalRaised, cashOnHand };
}

const donorIdCache = new Map<string, string>();

function donorKey(name: string, employer: string | null, city: string, state: string): string {
  const hash = createHash("sha1").update(`${name}|${employer ?? ""}|${city}|${state}`).digest("hex").slice(0, 8);
  return `${slugify(name)}-${hash}`;
}

async function upsertDonor(c: RawContribution): Promise<string | null> {
  const { name, city, state } = parseEntity(c.entityLines.join(" | "));
  if (!name || name === "Unknown") return null;
  const { employer, occupation } = c.isPac ? { employer: null, occupation: null } : parseEmployerOccupation(c.employerLines.join(" | "));

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
      sector: c.isPac ? "Political Committees" : classifySector(employer, occupation),
    },
    update: {},
  });
  donorIdCache.set(key, donor.id);
  return donor.id;
}

async function main() {
  // --no-sandbox is required to launch Chromium as root in a container
  // (Railway); harmless locally too.
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  console.log("Reading office list...");
  let offices = await getRelevantOffices(page);
  const testFilter = process.env.COPP_TEST_OFFICE;
  if (testFilter) offices = offices.filter((o) => o.label === testFilter);
  console.log(`Found ${offices.length} relevant offices (statewide + legislature + judicial).`);

  let officeCount = 0;
  let candidateCount = 0;
  let contributionCount = 0;

  for (const office of offices) {
    officeCount++;
    for (const year of yearsForLevel(office.level)) {
      let candidates: CandidateRow[] = [];
      try {
        candidates = await searchCandidates(page, office.value, year);
      } catch (err) {
        console.error(`  ${office.label} ${year}: search failed`, err);
        continue;
      }
      if (candidates.length === 0) continue;

      console.log(`\n${office.label} (${year}): ${candidates.length} candidate(s)`);
      for (const candidate of candidates) {
        try {
          const party = await getParty(page, office.value, year, candidate.id);
          const { contributions, totalRaised, cashOnHand } = await processCandidateFinancials(page, office.value, year, candidate.id);

          const slug = slugify(candidate.name);
          const politician = await db.politician.upsert({
            where: { slug },
            create: {
              slug,
              name: candidate.name,
              office: office.label,
              level: office.level,
              party,
              cycle: year,
              source: "MT_COPP",
              coppCandidateId: candidate.id,
              totalRaised,
              cashOnHand,
            },
            update: {
              office: office.label,
              level: office.level,
              party,
              cycle: year,
              source: "MT_COPP",
              coppCandidateId: candidate.id,
              totalRaised,
              cashOnHand,
            },
          });

          await db.contribution.deleteMany({ where: { politicianId: politician.id } });

          const rows: { donorId: string; amount: number; date: Date; isPac: boolean }[] = [];
          for (const c of contributions) {
            const donorId = await upsertDonor(c);
            if (!donorId) continue;
            rows.push({ donorId, amount: c.amount, date: c.date, isPac: c.isPac });
          }
          if (rows.length > 0) {
            await db.contribution.createMany({ data: rows.map((r) => ({ ...r, politicianId: politician.id })) });
          }

          candidateCount++;
          contributionCount += rows.length;
          console.log(`  ${candidate.name} (${party}): ${rows.length} contributions, $${totalRaised.toFixed(0)} raised`);
        } catch (err) {
          console.error(`  failed to ingest ${candidate.name}:`, err);
        }
      }
      break; // found data for this office/level at this year — don't try older years
    }
  }

  console.log(`\nDone. ${officeCount} offices checked, ${candidateCount} candidates ingested, ${contributionCount} contributions.`);
  await browser.close();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
