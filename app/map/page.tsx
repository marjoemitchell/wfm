import { getMapData } from "@/lib/queries";
import { money } from "@/lib/format";
import MontanaMap from "@/components/map/MontanaMap";
import NationalMap from "@/components/map/NationalMap";
import SplitBar from "@/components/map/SplitBar";
import LocationList from "@/components/map/LocationList";

export default async function MapPage() {
  const { montanaCities, states, topMetros, inStateTotal, outOfStateTotal, inStatePct } = await getMapData();
  const totalItemized = inStateTotal + outOfStateTotal;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
        <div>
          <h1 className="text-page-headline text-ink">Where the donors are</h1>
          <p className="text-body-copy mt-3 max-w-[520px] text-ink-secondary">
            Every itemized contribution, placed at the giver&apos;s mailing address: an individual, PAC, or
            committee. Shading is each state&apos;s total.
          </p>
        </div>
        <div>
          <div className="text-stat-secondary text-ink">{money(totalItemized)}</div>
          <div className="text-eyebrow mt-2 text-ink-tertiary">Total itemized</div>
        </div>
      </div>

      <SplitBar inStateTotal={inStateTotal} outOfStateTotal={outOfStateTotal} inStatePct={inStatePct} />

      <div className="grid grid-cols-1 gap-9 pt-[30px] sm:grid-cols-[1.8fr_1fr] sm:gap-[46px]">
        <div>
          <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Contributions by state</div>
          <div className="pt-6">
            <NationalMap states={states} />
          </div>
        </div>
        <LocationList
          title="Top metro areas"
          rows={topMetros.map((m) => ({ label: `${m.city}, ${m.state}`, amount: m.amount, committeeDominated: m.committeeDominated }))}
          footnote="Marked totals are dominated by transfers from national party and leadership committees registered at that address, not by individual donors."
        />
      </div>

      <div className="grid grid-cols-1 gap-9 pt-[46px] sm:grid-cols-[1.8fr_1fr] sm:gap-[46px]">
        <div>
          <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Inside Montana</div>
          <div className="pt-6">
            <MontanaMap cities={montanaCities} />
          </div>
        </div>
        <LocationList
          title="Montana cities"
          rows={[...montanaCities]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10)
            .map((c) => ({ label: c.city, amount: c.amount }))}
          barColor="var(--color-accent)"
        />
      </div>
    </div>
  );
}
