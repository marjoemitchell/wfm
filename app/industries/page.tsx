import type { Metadata } from "next";
import { getIndustries, getMoneyBySourceType } from "@/lib/queries";
import { moneyAbbreviated } from "@/lib/format";
import IndustryRow from "@/components/industries/IndustryRow";
import MoneyBySourceType from "@/components/industries/MoneyBySourceType";

export const metadata: Metadata = {
  title: "Money by Industry",
  description: "Contributions aggregated by industry across every officeholder this tracker covers.",
};

export default async function IndustriesPage() {
  const [{ rows, trackedTotal }, sourceType] = await Promise.all([getIndustries(), getMoneyBySourceType()]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
        <div>
          <h1 className="text-page-headline text-ink">Money by industry</h1>
          <p className="text-body-copy mt-3 max-w-[520px] text-ink-secondary">
            Itemized contributions aggregated across every officeholder in the tracker. Bars are scaled against the
            total below.
          </p>
        </div>
        <div>
          <div className="text-stat-secondary text-ink">{moneyAbbreviated(trackedTotal)}</div>
          <div className="text-eyebrow mt-2 text-ink-tertiary">Itemized contributions</div>
        </div>
      </div>

      <p className="max-w-[640px] pt-4 text-[13.8px] text-ink-faint">
        Smaller than the &quot;Total raised&quot; figure at the top of every page: that one counts everything a
        campaign reported raising, this one only counts contributions itemized by donor, which excludes small-dollar
        gifts below the reporting threshold.
      </p>

      <div className="pt-5">
        <MoneyBySourceType
          individualTotal={sourceType.individualTotal}
          pacTotal={sourceType.pacTotal}
          individualPct={sourceType.individualPct}
          pacPct={sourceType.pacPct}
        />
      </div>

      <div className="pt-9 text-eyebrow text-ink-quiet">By industry</div>
      <p className="mt-2 max-w-[640px] text-[13.8px] text-ink-faint">
        Based on each donor&apos;s self-reported employer and occupation, which a filer isn&apos;t always required to
        give and often leaves blank, especially retirees. &quot;Political Committees,&quot; &quot;Retired / Not
        employed&quot; and &quot;Other / Unclassified&quot; aren&apos;t industries; they&apos;re kept in this list
        rather than dropped so it still accounts for every dollar itemized, not just the share that maps to a real
        sector.
      </p>

      <div>
        {rows.map((row, i) => (
          <IndustryRow key={row.sector} row={row} index={i} />
        ))}
      </div>
    </div>
  );
}
