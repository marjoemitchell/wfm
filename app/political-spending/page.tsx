import type { Metadata } from "next";
import { getOutsideSpenders, getBallotMeasureSpenders } from "@/lib/queries";
import { moneyAbbreviated } from "@/lib/format";
import OutsideSpenderRow from "@/components/industries/OutsideSpenderRow";
import BallotMeasureSpenderRow from "@/components/political-spending/BallotMeasureSpenderRow";
import PoliticalSpendingTabs, { type SpendingCategory } from "@/components/political-spending/PoliticalSpendingTabs";

const HEADERS: Record<SpendingCategory, { title: string; body: string }> = {
  candidates: {
    title: "Political spending",
    body: "Money spent supporting or opposing a candidate, paid directly to vendors rather than given to their campaign. By law, an independent-expenditure committee can't coordinate with or donate to the candidates it spends on.",
  },
  "ballot-measures": {
    title: "Ballot measure spending",
    body: "Money spent supporting or opposing a statewide ballot measure (a Constitutional Initiative, statutory Initiative, or Legislative Referendum). A local levy or bond isn't included here: it's filed as free text with no official code, and the same measure shows up spelled a few different ways across filings with nothing to reconcile them against.",
  },
  electioneering: {
    title: "Electioneering communications",
    body: "Ads that name a candidate close to an election without expressly telling anyone how to vote, a separate legal category from an independent expenditure.",
  },
};

function resolveCategory(searchParams: { category?: string | string[] }): SpendingCategory {
  return searchParams.category === "ballot-measures" || searchParams.category === "electioneering"
    ? searchParams.category
    : "candidates";
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
  const { rows: ballotRows, trackedTotal: ballotTotal } =
    category === "ballot-measures" ? await getBallotMeasureSpenders() : { rows: [], trackedTotal: 0 };
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
          <div className="text-eyebrow mt-2 text-ink-tertiary">Total spent</div>
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

      {category === "ballot-measures" &&
        (ballotRows.length === 0 ? (
          <div className="py-[70px] text-center text-[18px] text-ink-quiet">No ballot-measure spending tracked yet.</div>
        ) : (
          <div>
            {ballotRows.map((row, i) => (
              <BallotMeasureSpenderRow key={row.slug} row={row} index={i} />
            ))}
          </div>
        ))}

      {category === "electioneering" && (
        <div className="py-[70px] text-center text-[18px] text-ink-quiet">
          Not tracked yet, on the list for a future update.
        </div>
      )}
    </div>
  );
}
