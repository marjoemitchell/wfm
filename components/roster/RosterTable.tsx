"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { money, percent, rank } from "@/lib/format";
import PartyChip from "./PartyChip";
import type { Party } from "@/lib/generated/prisma/enums";

export type RosterRowData = {
  slug: string;
  name: string;
  office: string;
  party: Party;
  totalRaised: number;
  outsideSupport: number;
  inStatePct: number;
  topSector: string;
  topSectorPct: number;
};

export default function RosterTable({ rows }: { rows: RosterRowData[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compare = (searchParams.get("compare") ?? "").split(",").filter(Boolean);
  const [showOutside, setShowOutside] = useState(false);
  const checkboxId = useId();
  const hasAnyOutsideSpending = rows.some((r) => r.outsideSupport > 0);

  function toggle(slug: string) {
    const next = compare.includes(slug)
      ? compare.filter((s) => s !== slug)
      : compare.length >= 4
        ? compare
        : [...compare, slug];

    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("compare", next.join(","));
    else params.delete("compare");
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  if (rows.length === 0) {
    return <div className="py-[70px] text-center text-[18px] text-ink-quiet">Nothing matches that search.</div>;
  }

  const displayRows = rows.map((row) => ({
    row,
    displayTotal: showOutside ? row.totalRaised + row.outsideSupport : row.totalRaised,
  }));
  if (showOutside) {
    displayRows.sort((a, b) => b.displayTotal - a.displayTotal);
  }

  return (
    <div>
      {hasAnyOutsideSpending && (
        <div className="flex justify-end border-b border-rule-faint py-3">
          <div className="group relative">
            <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-2 text-[15px] text-ink-quiet">
              <input
                id={checkboxId}
                type="checkbox"
                checked={showOutside}
                onChange={(e) => setShowOutside(e.target.checked)}
                className="h-[14px] w-[14px] accent-[var(--color-accent)]"
              />
              Include outside spending
            </label>
            <div className="pointer-events-none invisible absolute right-0 top-full z-10 mt-2 w-[260px] rounded border border-rule bg-ground-panel p-3 text-[14.4px] leading-relaxed text-ink-secondary opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
              Money spent independently by Super PACs and similar committees to help a candidate. Paid to vendors,
              never given to the campaign directly, so it is left out of Total raised by default. Turning this on
              also re-ranks the roster by the combined amount.
            </div>
          </div>
        </div>
      )}
      {displayRows.map(({ row, displayTotal }, i) => {
        const checked = compare.includes(row.slug);
        return (
          <div
            key={row.slug}
            className="grid grid-cols-[24px_1fr_auto_32px] items-start gap-3 border-b border-rule-faint py-5 hover:bg-ground-raised sm:grid-cols-[30px_2.3fr_1.4fr_1.5fr_1fr_40px] sm:items-center sm:gap-[22px]"
          >
            <span className="text-[15.6px] text-ink-quiet">{rank(i)}</span>
            <div className="min-w-0">
              <Link href={`/officeholder/${row.slug}`}>
                <div className="text-roster-name text-ink">{row.name}</div>
                <div className="text-[16.2px] text-ink-tertiary">{row.office}</div>
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:hidden">
                <PartyChip party={row.party} />
                <span className="text-[16.2px] text-ink-tertiary">
                  {row.topSector} · {percent(row.topSectorPct, 0)}
                </span>
                <span className="text-[15px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
                  In-state {percent(row.inStatePct)}
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <PartyChip party={row.party} />
              <div className="mt-2 text-[12px] uppercase text-ink-quiet" style={{ letterSpacing: "0.12em" }}>
                Top sector
              </div>
              <div className="text-[16.2px] text-ink-tertiary">
                {row.topSector} · {percent(row.topSectorPct, 0)}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="h-[2px] w-full bg-track">
                <div className="h-[2px] bg-accent" style={{ width: `${Math.min(100, row.inStatePct)}%` }} />
              </div>
              <div className="mt-2 text-[15px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
                In-state {percent(row.inStatePct)}
              </div>
            </div>
            <div className="text-roster-amount text-right tabular-nums text-ink">{money(displayTotal)}</div>
            <button
              type="button"
              onClick={() => toggle(row.slug)}
              aria-pressed={checked}
              aria-label={`Add ${row.name} to compare`}
              className="h-[26px] w-[26px] shrink-0 border"
              style={{
                borderColor: checked ? "var(--color-accent)" : "var(--color-border)",
                background: checked ? "var(--color-accent)" : "transparent",
                color: "var(--color-ground)",
              }}
            >
              {checked ? "✓" : ""}
            </button>
          </div>
        );
      })}

      {compare.length > 0 && (
        <div className="sticky bottom-[22px] flex justify-center pt-6">
          <Link
            href={`/compare?ids=${compare.join(",")}`}
            className="bg-accent px-[26px] py-[14px] text-btn-cta text-ground"
          >
            Compare {compare.length} →
          </Link>
        </div>
      )}
    </div>
  );
}
