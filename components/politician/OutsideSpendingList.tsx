import Link from "next/link";
import { money } from "@/lib/format";

export type OutsideSpender = { slug: string; name: string; city: string; state: string; support: number; oppose: number };

export default function OutsideSpendingList({
  supportTotal,
  opposeTotal,
  spenders,
}: {
  supportTotal: number;
  opposeTotal: number;
  spenders: OutsideSpender[];
}) {
  if (spenders.length === 0) return null;

  return (
    <div className="border-t border-rule pt-9">
      <div className="text-eyebrow text-accent">Outside spending</div>
      <p className="mt-2 max-w-[640px] text-[13.5px] text-ink-tertiary">
        Money Super PACs and other independent-expenditure committees spent supporting or opposing this candidate.
        By law this can&apos;t be coordinated with or given directly to their campaign, so it&apos;s tracked here
        separately from the contributions above, not counted in total raised.
      </p>

      <div className="mt-5 flex gap-10 border-b border-rule pb-5">
        <div>
          <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 32 }}>
            {money(supportTotal)}
          </div>
          <div className="text-eyebrow mt-1 text-ink-tertiary">Supporting</div>
        </div>
        <div>
          <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 32 }}>
            {money(opposeTotal)}
          </div>
          <div className="text-eyebrow mt-1 text-ink-tertiary">Opposing</div>
        </div>
      </div>

      {spenders.map((s) => (
        <Link
          key={s.slug}
          href={`/donor/${s.slug}`}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-rule-faint py-4 hover:bg-ground-raised"
        >
          <div className="min-w-0">
            <div className="truncate text-[15.5px] text-ink">{s.name}</div>
            <div className="truncate text-[13px] text-ink-tertiary">
              {s.city}, {s.state}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[15px] tabular-nums text-ink">{s.support > 0 ? money(s.support) : "—"}</div>
            <div className="text-[11px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
              For
            </div>
          </div>
          <div className="text-right">
            <div className="text-[15px] tabular-nums text-ink">{s.oppose > 0 ? money(s.oppose) : "—"}</div>
            <div className="text-[11px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
              Against
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
