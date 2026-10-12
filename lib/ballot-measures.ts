import { slugify } from "@/lib/format";

// Hand-maintained details for each statewide ballot measure the site
// covers. COPP filings only ever carry a measure's code, never its
// title, what it does, or whether it made the ballot, so this is the one
// place those live. Descriptions are paraphrased neutrally from the
// Secretary of State's ballot issue pages (SOS_URL) and should be checked
// against them when a new cycle's measures are added. A measure listed
// here shows up on the ballot-measures page even with no spending
// tracked against it yet; spending on a code that isn't listed here is
// still stored by ingest-copp-ie.ts but not shown.

export type BallotMeasureStatus =
  | { kind: "upcoming"; electionDate: string }
  | { kind: "decided"; electionDate: string; passed: boolean; result: string }
  | { kind: "did-not-qualify"; note: string };

export type BallotMeasureInfo = {
  code: string;
  type: "Constitutional Initiative" | "Initiative" | "Legislative Referendum";
  title: string;
  description: string;
  status: BallotMeasureStatus;
  sourceUrl: string;
};

const SOS_2026_URL = "https://sosmt.gov/elections/ballot_issues/proposed-2026-ballot-issues/";
const SOS_2024_URL = "https://sosmt.gov/elections/ballot_issues/";

export const BALLOT_MEASURES: BallotMeasureInfo[] = [
  {
    code: "CI-132",
    type: "Constitutional Initiative",
    title: "Nonpartisan judicial elections",
    description:
      "Would amend the Montana Constitution to require that elections for Montana Supreme Court justices and district court judges stay nonpartisan, so party labels couldn't be added to judicial races without another vote to change the constitution.",
    status: { kind: "upcoming", electionDate: "2026-11-03" },
    sourceUrl: SOS_2026_URL,
  },
  {
    code: "CI-133",
    type: "Constitutional Initiative",
    title: "Initiative and referendum rights",
    description:
      "Would add Montanans' power to propose laws and constitutional amendments by initiative, and to refer laws to voters by referendum, to the constitution's Declaration of Rights. It would require ballot issues to be handled promptly and impartially, bar disqualifying them over minor technical problems, and set rules for withdrawing a petition signature.",
    status: { kind: "upcoming", electionDate: "2026-11-03" },
    sourceUrl: SOS_2026_URL,
  },
  {
    code: "I-194",
    type: "Initiative",
    title: "Political spending by corporations and other entities",
    description:
      "Would limit corporations, nonprofits, trusts and other \"artificial persons\" to the powers state law grants them, which would not include spending money on elections, ballot issues or political parties. An entity that broke the rule would lose its privileges to do business in Montana.",
    status: { kind: "upcoming", electionDate: "2026-11-03" },
    sourceUrl: SOS_2026_URL,
  },
  {
    code: "CI-128",
    type: "Constitutional Initiative",
    title: "Abortion rights",
    description:
      "Added a right to make and carry out decisions about one's own pregnancy, including abortion, to the Montana Constitution.",
    status: { kind: "decided", electionDate: "2024-11-05", passed: true, result: "Passed with 58% of the vote" },
    sourceUrl: SOS_2024_URL,
  },
  {
    code: "CI-126",
    type: "Constitutional Initiative",
    title: "Top-four primary",
    description:
      "Would have replaced Montana's party primaries with a single primary open to every candidate, with the top four vote-getters for each office advancing to the general election regardless of party.",
    status: { kind: "decided", electionDate: "2024-11-05", passed: false, result: "Failed with 51% voting no" },
    sourceUrl: SOS_2024_URL,
  },
  {
    code: "CI-127",
    type: "Constitutional Initiative",
    title: "Majority vote to win",
    description:
      "Would have required candidates for most state and federal offices to win a majority of the vote, rather than the most votes, to be elected, leaving the Legislature to decide how.",
    status: { kind: "decided", electionDate: "2024-11-05", passed: false, result: "Failed with 60% voting no" },
    sourceUrl: SOS_2024_URL,
  },
  {
    code: "CI-134",
    type: "Constitutional Initiative",
    title: "Property tax cap",
    description:
      "Would have capped annual increases in local government property taxes at 2%, with transition rules and exceptions.",
    status: {
      kind: "did-not-qualify",
      note: "Approved to gather signatures in April 2026, but its campaign was suspended before collecting enough to make the 2026 ballot.",
    },
    sourceUrl: SOS_2026_URL,
  },
];

export function ballotMeasureSlug(code: string): string {
  return slugify(code);
}

export function getBallotMeasureInfo(slug: string): BallotMeasureInfo | null {
  return BALLOT_MEASURES.find((m) => ballotMeasureSlug(m.code) === slug) ?? null;
}

export function ballotMeasureStatusLabel(status: BallotMeasureStatus): string {
  const date = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  if (status.kind === "upcoming") return `On the ${date(status.electionDate)} ballot`;
  if (status.kind === "decided") return `${status.passed ? "Passed" : "Failed"}, ${date(status.electionDate)}`;
  return "Did not make the ballot";
}
