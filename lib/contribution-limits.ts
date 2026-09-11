export type Tone = "ok" | "uncapped" | "prohibited" | "muted";
export type Part = { text: string; tone: Tone };

export type FederalRow = {
  name: string;
  controlledBy: string;
  donationLimit: Part[];
  coordinate: Part[];
  discloseDonors: Part[];
};

export const FEDERAL_CYCLE = "2026";

export const FEDERAL_ROWS: FederalRow[] = [
  {
    name: "Traditional Campaign",
    controlledBy: "The Candidate",
    donationLimit: [{ text: "Yes", tone: "ok" }, { text: " ($3,300)", tone: "muted" }],
    coordinate: [{ text: "Yes", tone: "ok" }, { text: " (It is the campaign)", tone: "muted" }],
    discloseDonors: [{ text: "Yes", tone: "ok" }],
  },
  {
    name: "Traditional PAC",
    controlledBy: "Corporations, Unions, or Interest Groups",
    donationLimit: [{ text: "Yes", tone: "ok" }, { text: " ($5,000)", tone: "muted" }],
    coordinate: [{ text: "Yes", tone: "ok" }, { text: " (Can donate straight to campaigns)", tone: "muted" }],
    discloseDonors: [{ text: "Yes", tone: "ok" }],
  },
  {
    name: "Leadership PAC",
    controlledBy: "Politicians/Officeholders",
    donationLimit: [{ text: "Yes", tone: "ok" }, { text: " ($5,000)", tone: "muted" }],
    coordinate: [{ text: "Yes", tone: "ok" }, { text: " (Used to fund other candidates)", tone: "muted" }],
    discloseDonors: [{ text: "Yes", tone: "ok" }],
  },
  {
    name: "Joint Fundraising Committee (JFC)",
    controlledBy: "A Partnership of Candidates & Parties",
    donationLimit: [{ text: "Yes", tone: "ok" }, { text: " (But limits are stacked)", tone: "muted" }],
    coordinate: [{ text: "Yes", tone: "ok" }, { text: " (Money is split among members)", tone: "muted" }],
    discloseDonors: [{ text: "Yes", tone: "ok" }],
  },
  {
    name: "Super PAC",
    controlledBy: "Independent Staff & Consultants",
    donationLimit: [{ text: "No", tone: "uncapped" }, { text: " (Unlimited)", tone: "muted" }],
    coordinate: [{ text: "NO", tone: "prohibited" }, { text: " (Strictly prohibited)", tone: "muted" }],
    discloseDonors: [{ text: "Yes", tone: "ok" }],
  },
  {
    name: "Hybrid PAC (Carey Committee)",
    controlledBy: "Independent Staff (Dual-Account)",
    donationLimit: [
      { text: "No", tone: "uncapped" },
      { text: " (For independent ads) / ", tone: "muted" },
      { text: "Yes", tone: "ok" },
      { text: " (For campaign gifts)", tone: "muted" },
    ],
    coordinate: [{ text: "NO", tone: "prohibited" }, { text: " (For the unlimited ad account)", tone: "muted" }],
    discloseDonors: [{ text: "Yes", tone: "ok" }],
  },
  {
    name: '501(c) Non-Profit ("Dark Money")',
    controlledBy: "Issue Advocacy Groups",
    donationLimit: [{ text: "No", tone: "uncapped" }, { text: " (Unlimited)", tone: "muted" }],
    coordinate: [{ text: "NO", tone: "prohibited" }, { text: " (Strictly prohibited)", tone: "muted" }],
    discloseDonors: [{ text: "NO", tone: "prohibited" }, { text: " (Completely anonymous)", tone: "muted" }],
  },
];

export type StateRow = {
  source: string;
  description: string;
  tone: Tone;
  governor: string;
  otherStatewide: string;
  legislature: string;
};

// COPP contribution-limits summary, 2026-27 cycle, applicable as of the
// date below. politicalpractices.mt.gov/home/Contribution-Limits
// Constructed from local-time parts (not an ISO string) so formatting
// with toLocaleDateString can't roll it back a day in timezones behind UTC.
export const STATE_LIMITS_EFFECTIVE_DATE = new Date(2025, 10, 7);

export const STATE_ROWS: StateRow[] = [
  {
    source: "The candidate",
    description: "To their own campaign",
    tone: "uncapped",
    governor: "No limit",
    otherStatewide: "No limit",
    legislature: "No limit",
  },
  {
    source: "Individual",
    description: "A human being",
    tone: "ok",
    governor: "$1,190",
    otherStatewide: "$830",
    legislature: "$470",
  },
  {
    source: "Political committee",
    description: "PACs; excludes party committees",
    tone: "ok",
    governor: "$1,190",
    otherStatewide: "$830",
    legislature: "$470",
  },
  {
    source: "Political party committee",
    description: "Aggregate from all party committees",
    tone: "ok",
    governor: "$118,700",
    otherStatewide: "$89,050",
    legislature: "$3,550 Senate / $2,350 House",
  },
  {
    source: "Corporation or union",
    description: "Directly or indirectly",
    tone: "prohibited",
    governor: "Prohibited",
    otherStatewide: "Prohibited",
    legislature: "Prohibited",
  },
];

export const STATE_NOTES: { title: string; body: string }[] = [
  {
    title: '"Per election" is not per cycle',
    body: "A contested primary and a general election count as two separate elections, so the cap applies twice. With no contested primary there is only one.",
  },
  {
    title: "Corporate money routes around the ban",
    body: "Corporations and unions may not give to a candidate, but they may fund a segregated PAC out of voluntary contributions from shareholders, employees or members, and independent spending is not capped at all.",
  },
  {
    title: "Party money now reaches judges",
    body: "House Bill 39 (2025) repealed Montana's prohibition on party committees contributing to judicial candidates, so Supreme Court and district judge races can now take party money.",
  },
];

// Split right before the Commissioner of Political Practices link so the
// page can make that phrase itself the anchor, rather than appending a
// bare URL after the sentence.
export const FOOTNOTE_TEXT_PREFIX =
  "State figures are the COPP summary applicable as of 7 November 2025; party-committee giving to Public Service Commission candidates is capped separately at $17,800 per election. Individuals and political committees may give without limit to party committees, PACs and ballot issue committees. Federal figures are per-election amounts for the 2026 cycle. Full requirements are in Title 13, Chapters 35 and 37, MCA, and at the ";
