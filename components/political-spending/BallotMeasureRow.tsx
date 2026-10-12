import Link from "next/link";
import { money } from "@/lib/format";
import { ballotMeasureSlug, ballotMeasureStatusLabel, type BallotMeasureInfo } from "@/lib/ballot-measures";
import type { BallotMeasureSpending } from "@/lib/queries";
import SupportOpposeBar from "@/components/political-spending/SupportOpposeBar";

export default function BallotMeasureRow({ measure, spending }: { measure: BallotMeasureInfo; spending: BallotMeasureSpending | null }) {
  const total = spending ? spending.supportTotal + spending.opposeTotal + spending.unclearTotal : 0;

  return (
    <Link
      href={`/ballot-measure/${ballotMeasureSlug(measure.code)}`}
      className="grid grid-cols-1 gap-3 border-b border-rule-faint py-[22px] hover:bg-ground-raised sm:grid-cols-[1.5fr_2fr_1fr] sm:items-center sm:gap-6"
    >
      <div className="min-w-0">
        <div className="text-[clamp(18px,4.5vw,27.6px)] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {measure.code}: {measure.title}
        </div>
        <div className="text-[16.2px] text-ink-tertiary">{ballotMeasureStatusLabel(measure.status)}</div>
      </div>
      <div>
        {spending && total > 0 ? (
          <>
            <SupportOpposeBar supportTotal={spending.supportTotal} opposeTotal={spending.opposeTotal} unclearTotal={spending.unclearTotal} />
            {spending.sharedTotal > 0 && (
              <p className="mt-2 text-[14.4px] text-ink-faint">
                Includes {money(spending.sharedTotal)} spent jointly with another measure, counted on both
              </p>
            )}
          </>
        ) : (
          <p className="text-[16.2px] text-ink-quiet">No spending tracked yet</p>
        )}
      </div>
      <div className="sm:text-right">
        <div className="text-[21.6px] tabular-nums text-ink">{money(total)}</div>
        <div className="text-[15.6px] text-ink-quiet">
          {spending?.committees.length ?? 0} {spending?.committees.length === 1 ? "committee" : "committees"}
        </div>
      </div>
    </Link>
  );
}
