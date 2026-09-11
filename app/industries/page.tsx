import { getIndustries, getOutsideSpenders } from "@/lib/queries";
import { moneyAbbreviated } from "@/lib/format";
import IndustryRow from "@/components/industries/IndustryRow";
import OutsideSpenderRow from "@/components/industries/OutsideSpenderRow";
import IndustriesTabs from "@/components/industries/IndustriesTabs";

export default async function IndustriesPage(props: PageProps<"/industries">) {
  const searchParams = await props.searchParams;
  const view = searchParams.view === "spending" ? "spending" : "industry";

  if (view === "spending") {
    const { rows, trackedTotal } = await getOutsideSpenders();

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
          <div>
            <h1 className="text-page-headline text-ink">Outside spending</h1>
            <p className="text-body-copy mt-3 max-w-[520px] text-ink-secondary">
              Money spent supporting or opposing a candidate, paid directly to vendors rather than given to their
              campaign. By law, an independent-expenditure committee can&apos;t coordinate with or donate to the
              candidates it spends on.
            </p>
          </div>
          <div>
            <div className="text-stat-secondary text-ink">{moneyAbbreviated(trackedTotal)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Total spent</div>
          </div>
        </div>

        <IndustriesTabs active="spending" />

        {rows.length === 0 ? (
          <div className="py-[70px] text-center text-[18px] text-ink-quiet">No independent expenditures tracked yet.</div>
        ) : (
          <div>
            {rows.map((row, i) => (
              <OutsideSpenderRow key={row.slug} row={row} index={i} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const { rows, trackedTotal } = await getIndustries();

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
        <div>
          <h1 className="text-page-headline text-ink">Money by industry</h1>
          <p className="text-body-copy mt-3 max-w-[520px] text-ink-secondary">
            Contributions aggregated across every officeholder in the tracker. Bars are scaled against the
            tracked total.
          </p>
        </div>
        <div>
          <div className="text-stat-secondary text-ink">{moneyAbbreviated(trackedTotal)}</div>
          <div className="text-eyebrow mt-2 text-ink-tertiary">Tracked total</div>
        </div>
      </div>

      <IndustriesTabs active="industry" />

      <div>
        {rows.map((row, i) => (
          <IndustryRow key={row.sector} row={row} index={i} />
        ))}
      </div>
    </div>
  );
}
