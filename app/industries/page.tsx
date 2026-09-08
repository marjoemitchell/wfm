import { getIndustries } from "@/lib/queries";
import { moneyAbbreviated } from "@/lib/format";
import IndustryRow from "@/components/industries/IndustryRow";

export default async function IndustriesPage() {
  const { rows, trackedTotal } = await getIndustries();

  return (
    <div>
      <div className="grid grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
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

      <div>
        {rows.map((row, i) => (
          <IndustryRow key={row.sector} row={row} index={i} />
        ))}
      </div>
    </div>
  );
}
