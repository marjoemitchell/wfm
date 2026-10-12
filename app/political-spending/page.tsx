import type { Metadata } from "next";
import {
  getOutsideSpenders,
  getBallotMeasureSpendingByCode,
  getBallotMeasureSpendingTotal,
  type BallotMeasureSpending,
} from "@/lib/queries";
import { BALLOT_MEASURES } from "@/lib/ballot-measures";
import { moneyAbbreviated } from "@/lib/format";
import OutsideSpenderRow from "@/components/industries/OutsideSpenderRow";
import BallotMeasureRow from "@/components/political-spending/BallotMeasureRow";
import PoliticalSpendingTabs, { type SpendingCategory } from "@/components/political-spending/PoliticalSpendingTabs";

const HEADERS: Record<SpendingCategory, { title: string; body: string }> = {
  candidates: {
    title: "Political spending",
    body: "Money spent supporting or opposing a candidate, paid directly to vendors rather than given to their campaign. By law, an independent-expenditure committee can't coordinate with or donate to the candidates it spends on.",
  },
  "ballot-measures": {
    title: "Ballot measures",
    body: "Montana's statewide ballot measures, and the money committees have spent for and against each one. Select a measure to see what it does and who's spending on it.",
  },
};

function resolveCategory(searchParams: { category?: string | string[] }): SpendingCategory {
  return searchParams.category === "ballot-measures" ? searchParams.category : "candidates";
}

export async function generateMetadata(props: PageProps<"/political-spending">): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const { title, body } = HEADERS[resolveCategory(searchParams)];
  return { title, description: body };
}

export default async function PoliticalSpendingPage(props: PageProps<"/political-spending">) {
  const searchParams = await props.searchParams;
  const category = resolveCategory(searchParams);

  const header = HEADERS[category];
  const { rows: candidateRows, trackedTotal: candidateTotal } =
    category === "candidates" ? await getOutsideSpenders() : { rows: [], trackedTotal: 0 };
  const upcomingMeasures = BALLOT_MEASURES.filter((m) => m.status.kind === "upcoming");
  const pastMeasures = BALLOT_MEASURES.filter((m) => m.status.kind !== "upcoming");
  const [ballotSpending, ballotTotal]: [Record<string, BallotMeasureSpending>, number] =
    category === "ballot-measures"
      ? await Promise.all([getBallotMeasureSpendingByCode(), getBallotMeasureSpendingTotal(upcomingMeasures.map((m) => m.code))])
      : [{}, 0];
  const trackedTotal = category === "candidates" ? candidateTotal : category === "ballot-measures" ? ballotTotal : 0;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
        <div>
          <h1 className="text-page-headline text-ink">{header.title}</h1>
          <p className="text-body-copy mt-3 max-w-[520px] text-ink-secondary">{header.body}</p>
        </div>
        <div>
          <div className="text-stat-secondary text-ink">{moneyAbbreviated(trackedTotal)}</div>
          <div className="text-eyebrow mt-2 text-ink-tertiary">
            {category === "ballot-measures" ? "Spent on 2026 measures" : "Total spent"}
          </div>
        </div>
      </div>

      <PoliticalSpendingTabs active={category} />

      {category === "candidates" &&
        (candidateRows.length === 0 ? (
          <div className="py-[70px] text-center text-[18px] text-ink-quiet">No independent expenditures tracked yet.</div>
        ) : (
          <div>
            {candidateRows.map((row, i) => (
              <OutsideSpenderRow key={row.slug} row={row} index={i} />
            ))}
          </div>
        ))}

      {category === "ballot-measures" && (
        <div>
          <div className="border-b border-rule pt-9 pb-3 text-eyebrow text-accent">On the November 3, 2026 ballot</div>
          {upcomingMeasures.map((m) => (
            <BallotMeasureRow key={m.code} measure={m} spending={ballotSpending[m.code] ?? null} />
          ))}
          <div className="border-b border-rule pt-12 pb-3 text-eyebrow text-ink-quiet">Earlier measures</div>
          {pastMeasures.map((m) => (
            <BallotMeasureRow key={m.code} measure={m} spending={ballotSpending[m.code] ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
