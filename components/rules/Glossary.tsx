const TERMS: { term: string; body: string }[] = [
  {
    term: "Ballot measure spending",
    body: "Money raised or spent for or against a statewide ballot measure (a constitutional initiative, statutory initiative, or legislative referendum), not tied to any candidate. A local levy or bond isn't included: it's filed as free text with no official code, and the same measure shows up spelled a few different ways across filings with nothing to reconcile them against.",
  },
  {
    term: "Cash on hand",
    body: "How much money a campaign reported still having in the bank at the end of its most recently filed report, federal or state.",
  },
  {
    term: "Committee type",
    body: "Federal and Montana law each define a handful of these (a traditional PAC, a Super PAC, a Joint Fundraising Committee, and others), each with its own limit on how much it can raise, whether it can coordinate with a campaign, and whether its own donors are ever disclosed publicly. See the tables above for what each one can and can't do.",
  },
  {
    term: "Compare",
    body: "Select up to four officeholders or candidates from the roster to view their funding side by side.",
  },
  {
    term: "Electioneering communication",
    body: "An ad that names a candidate close to an election without expressly telling anyone how to vote, a separate legal category from an independent expenditure with its own disclosure rules.",
  },
  {
    term: "Independent expenditure",
    body: "The kind of political spending that expressly tells someone how to vote (\"vote for,\" \"defeat\"), reported by the committee that paid for it, not by the candidate it names. By law that committee can't coordinate with the candidate it's spending on.",
  },
  {
    term: "In-state %",
    body: "Shown two ways on this site. The \"Median in-state\" figure at the top of every page is a median: it takes each officeholder's own in-state percentage and finds the middle one, so a handful of races dominated by out-of-state money can't drag it down by themselves. The in-state share on the donor geography page is dollar-weighted instead, every dollar counted once wherever it came from, which is why the two numbers rarely match.",
  },
  {
    term: "Itemized contributions",
    body: "Contributions from donors who gave enough that the campaign had to report their name and address. Smaller gifts are reported in an aggregate lump sum instead, which is why every itemized total on this site (money by industry, donor geography, money by source type) is smaller than Total raised.",
  },
  {
    term: "Money by source type",
    body: "Splits itemized contributions by who gave them: a named individual person, or a PAC or committee. A different question from which industry the money came from, which is what the sector breakdown answers instead.",
  },
  {
    term: "Named donors",
    body: "The count of distinct individuals, PACs, and committees who appear by name across every itemized contribution this tracker has.",
  },
  {
    term: "Outside support / Political spending",
    body: "Money spent independently by Super PACs and similar committees to help or hurt a candidate, paid to vendors directly rather than given to the campaign. Left out of Total raised, since the campaign itself never touches it.",
  },
  {
    term: "Sector / industry",
    body: "A category assigned from a donor's self-reported employer and occupation, which a filer isn't always required to give and often leaves blank. Contributions that don't map to a real industry (a PAC as the donor, \"retired,\" left blank) are grouped into \"Political Committees,\" \"Retired / Not employed,\" or \"Other / Unclassified\" instead of being dropped, so the totals still cover every itemized dollar.",
  },
  {
    term: "Top sector",
    body: "The industry category that gave the most to a given officeholder or candidate, built from their donors' self-reported employer and occupation.",
  },
  {
    term: "Total raised",
    body: "Everything a campaign reported raising to the FEC or Montana COPP, including small-dollar contributions below the itemization threshold. The headline figure on every officeholder's page.",
  },
];

export default function Glossary() {
  return (
    <div id="glossary" className="pt-10">
      <h2 className="text-[40.8px] text-ink" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
        Glossary
      </h2>
      <p className="text-body-copy mt-3 max-w-[640px] text-ink-secondary">
        What the labels and figures used throughout this site actually mean.
      </p>
      <dl className="mt-6 border-t border-rule">
        {TERMS.map(({ term, body }) => (
          <div key={term} className="border-b border-rule-faint py-5">
            <dt className="text-donor-row-name text-ink">{term}</dt>
            <dd className="text-body-copy mt-1.5 max-w-[720px] text-ink-secondary">{body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
