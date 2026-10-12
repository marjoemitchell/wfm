import Link from "next/link";
import { money, slugify } from "@/lib/format";
import type { BallotMeasureSpending } from "@/lib/queries";

export default function BallotMeasureCommitteeList({ code, spending }: { code: string; spending: BallotMeasureSpending | null }) {
  const committees = spending?.committees ?? [];

  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Committees spending on {code}</div>
      <p className="mt-2 max-w-[640px] text-[16.2px] text-ink-tertiary">
        Committees formed for this measure, counted in full, plus other committees&apos; independent expenditures
        that name it. Whether a committee is for or against comes from its own registration or filing.
      </p>
      {committees.length === 0 && (
        <div className="py-[50px] text-center text-[18px] text-ink-quiet">No spending on {code} tracked yet.</div>
      )}
      {committees.map((c) => (
        <Link
          key={c.slug}
          href={`/donor/${c.slug}?from=measure:${slugify(code)}`}
          className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-faint py-5 hover:bg-ground-raised sm:gap-[22px]"
        >
          <div className="min-w-0">
            <div className="text-recipient-name text-ink">{c.name}</div>
            <div className="text-[16.2px] text-ink-tertiary">
              {[c.supportTotal > 0 && "Supporting", c.opposeTotal > 0 && "Opposing", c.unclearTotal > 0 && "Direction unclear"]
                .filter(Boolean)
                .join(", ")}
              {c.sharedWith.length > 0 && (
                <>
                  {" "}
                  · Spent jointly with {c.sharedWith.join(", ")}, not split between them
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            {c.supportTotal > 0 && <div className="text-recipient-name tabular-nums text-ink">{money(c.supportTotal)} for</div>}
            {c.opposeTotal > 0 && <div className="text-recipient-name tabular-nums text-accent">{money(c.opposeTotal)} against</div>}
            {c.unclearTotal > 0 && <div className="text-recipient-name tabular-nums text-ink-secondary">{money(c.unclearTotal)} spent</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}
