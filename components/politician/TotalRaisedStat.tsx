"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";

export type OutsideSpender = { slug: string; name: string; city: string; state: string; support: number; oppose: number };

export default function TotalRaisedStat({
  totalRaised,
  cashOnHand,
  outsideSpending,
}: {
  totalRaised: number;
  cashOnHand: number;
  outsideSpending: { supportTotal: number; opposeTotal: number; spenders: OutsideSpender[] };
}) {
  const [showOutside, setShowOutside] = useState(false);
  const checkboxId = useId();
  const hasOutsideSpending = outsideSpending.spenders.length > 0;
  const displayTotal = showOutside ? totalRaised + outsideSpending.supportTotal : totalRaised;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <div>
        <div className="text-stat-secondary text-ink">{money(displayTotal)}</div>
        <div className="text-eyebrow mt-2 text-ink-tertiary">Total raised</div>
        {hasOutsideSpending && (
          <label htmlFor={checkboxId} className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-ink-quiet">
            <input
              id={checkboxId}
              type="checkbox"
              checked={showOutside}
              onChange={(e) => setShowOutside(e.target.checked)}
              className="h-[14px] w-[14px] accent-[var(--color-accent)]"
            />
            Include outside spending
          </label>
        )}
      </div>
      <div>
        <div className="text-stat-secondary text-ink">{money(cashOnHand)}</div>
        <div className="text-eyebrow mt-2 text-ink-tertiary">Cash on hand</div>
      </div>

      {showOutside && hasOutsideSpending && (
        <div className="col-span-full mt-2 border-t border-rule pt-4">
          <p className="text-[12px] text-ink-faint">
            {money(outsideSpending.supportTotal)} from Super PACs and other independent-expenditure committees
            supporting this candidate — by law, spent independently rather than given to the campaign, so it&apos;s
            added here rather than counted in the official total above.
            {outsideSpending.opposeTotal > 0 && ` Another ${money(outsideSpending.opposeTotal)} was spent opposing them.`}
          </p>
          <div className="mt-3">
            {outsideSpending.spenders.map((s) => (
              <Link
                key={s.slug}
                href={`/donor/${s.slug}`}
                className="flex items-center justify-between gap-3 border-b border-rule-faint py-2.5 hover:bg-ground-raised"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] text-ink">{s.name}</div>
                  <div className="truncate text-[11.5px] text-ink-tertiary">
                    {s.city}, {s.state}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[13px] tabular-nums text-ink-secondary">
                  {s.support > 0 && <div>{money(s.support)} for</div>}
                  {s.oppose > 0 && <div>{money(s.oppose)} against</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
