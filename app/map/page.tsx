import { getMapData } from "@/lib/queries";
import { moneyAbbreviated } from "@/lib/format";
import MontanaMap from "@/components/map/MontanaMap";
import OutOfStatePanel from "@/components/map/OutOfStatePanel";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { cities, states, outOfStateTotal } = await getMapData();

  return (
    <div>
      <div className="grid grid-cols-[1.4fr_1fr] items-end gap-[50px] border-b border-accent pt-[38px] pb-[26px]">
        <div>
          <h1 className="text-page-headline text-ink">Where the donors are</h1>
          <p className="text-body-copy mt-3 max-w-[520px] text-ink-secondary">
            Circle area is total contributions from donors with that mailing address.
          </p>
        </div>
        <div>
          <div className="text-stat-secondary text-ink">{moneyAbbreviated(outOfStateTotal)}</div>
          <div className="text-eyebrow mt-2 text-ink-tertiary">From outside Montana</div>
        </div>
      </div>

      <div className="grid grid-cols-[1.8fr_1fr] gap-[46px] pt-[30px]">
        <MontanaMap cities={cities} />
        <OutOfStatePanel states={states} />
      </div>
    </div>
  );
}
