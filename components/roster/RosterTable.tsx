"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { money, percent, rank, levelLabel, NO_FILINGS_LABEL } from "@/lib/format";
import PartyChip from "./PartyChip";
import { buildRosterHref } from "./FilterBar";
import type { Party, Level } from "@/lib/generated/prisma/enums";

// Federal first, then by how directly statewide voters chose the office,
// matching the order the branch filter itself already lists them in.
// Section headers only render when a view actually spans more than one
// of these (an unfiltered "All" view), so filtering to a single branch
// looks exactly as it did before grouping existed: one flat list, no
// redundant header repeating what the filter tab above it already says.
const LEVEL_GROUP_ORDER: Level[] = ["FEDERAL", "STATEWIDE", "LEGISLATURE", "JUDICIAL"];

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

// Aligned to RosterTable's own sm:grid-cols-[30px_2.3fr_1.4fr_1.5fr_1fr_40px]
// below, column for column: this replaced FilterBar's old floating "Sort"
// row, which sat off to the right unaligned to any of the columns it
// claimed to sort, and left three columns (Top sector, In-state, the
// amount) with no header at all. Desktop only: mobile stacks every field
// into one block per row, so a separate header row has nothing to align
// to there. Not every column is sortable (Sector isn't a RosterSort key
// at all), so this is listed explicitly per column rather than mapped
// from an array, the two don't share an order.
function RosterTableHeader({ params }: { params: URLSearchParams }) {
  const sort = params.get("sort") || "raised";
  const headerClass = (active: boolean) => `text-[12.6px] uppercase tracking-[0.12em] ${active ? "text-accent" : "text-ink-quiet"}`;
  return (
    <div className="hidden border-b border-rule py-3 sm:grid sm:grid-cols-[30px_2.3fr_1.4fr_1.5fr_1fr_40px] sm:items-center sm:gap-[22px]">
      <span />
      <Link href={buildRosterHref(params, { sort: "name" })} className={headerClass(sort === "name")}>
        Name
      </Link>
      <span className={headerClass(false)}>Sector</span>
      <Link href={buildRosterHref(params, { sort: "instate" })} className={headerClass(sort === "instate")}>
        In-state %
      </Link>
      <Link href={buildRosterHref(params, { sort: "raised" })} className={`text-right ${headerClass(sort === "raised")}`}>
        Total raised
      </Link>
      {/* No "Compare" label: unlike the other four, this column isn't a
          sortable data field, just the same per-row toggle button repeated
          down the list, which doesn't need a heading to explain it. */}
      <span />
    </div>
  );
}

export type RosterRowData = {
  slug: string;
  name: string;
  office: string;
  party: Party;
  level: Level;
  totalRaised: number;
  hasFilings: boolean;
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
  const [perPage, setPerPage] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const checkboxId = useId();
  const listTopRef = useRef<HTMLDivElement>(null);
  const hasAnyOutsideSpending = rows.some((r) => r.outsideSupport > 0);

  // A new level/sort/search query changes what this list even contains,
  // so whatever page the visitor was on before no longer means the same
  // thing; only these three (not the outside-spending toggle or a compare
  // selection, which don't change the underlying set) reset back to page
  // one. Compared and applied during render, React's own recommended
  // pattern for adjusting state from a prop change, rather than in an
  // effect: an effect here would still commit the stale page's render
  // first, then immediately schedule a second one to fix it.
  const filterKey = `${searchParams.get("level")}|${searchParams.get("sort")}|${searchParams.get("query")}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  function goToPage(p: number) {
    setPage(p);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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

  // Grouped by level (Federal, Statewide, Legislature, Judicial) so an
  // unfiltered "All" view isn't one undifferentiated list of 467+ rows;
  // only worth doing when a view actually spans more than one level, a
  // single-branch filter renders exactly as it did before grouping
  // existed. This reorders displayRows itself (level as the primary key,
  // the existing sort as secondary within each group) before pagination
  // ever slices it, so a page boundary can only ever fall between groups
  // or inside one, never scatter rows from different groups together.
  const showGroupHeaders = new Set(displayRows.map((d) => d.row.level)).size > 1;
  const orderedRows = showGroupHeaders
    ? LEVEL_GROUP_ORDER.flatMap((level) => displayRows.filter((d) => d.row.level === level))
    : displayRows;

  const totalPages = Math.max(1, Math.ceil(orderedRows.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * perPage;
  const pageRows = orderedRows.slice(pageStart, pageStart + perPage);

  // Built from just this page's slice, not the full list, so a header
  // only repeats when a page actually opens on a new group or crosses
  // into one partway through; the first row of every page forces one
  // regardless (lastLevel starts as null, matching nothing), so a page
  // that starts mid-group still tells you which one you're looking at
  // instead of leaving it to be inferred from an earlier page.
  type RenderItem =
    | { type: "header"; level: Level }
    | { type: "row"; row: RosterRowData; displayTotal: number; rankIndex: number };
  const renderItems: RenderItem[] = [];
  let lastLevel: Level | null = null;
  pageRows.forEach(({ row, displayTotal }, i) => {
    if (showGroupHeaders && row.level !== lastLevel) {
      renderItems.push({ type: "header", level: row.level });
      lastLevel = row.level;
    }
    renderItems.push({ type: "row", row, displayTotal, rankIndex: pageStart + i });
  });

  return (
    <div>
      <div ref={listTopRef} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule-faint py-3">
        <div className="flex items-center gap-3 text-[15px] text-ink-quiet">
          <span className="uppercase" style={{ letterSpacing: "0.1em" }}>
            Rows per page
          </span>
          <div className="flex gap-3">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPerPage(size);
                  setPage(1);
                }}
                aria-pressed={perPage === size}
                className={perPage === size ? "text-accent" : "hover:text-ink"}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        {hasAnyOutsideSpending && (
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
        )}
      </div>
      <RosterTableHeader params={new URLSearchParams(searchParams.toString())} />
      {renderItems.map((item) => {
        if (item.type === "header") {
          return (
            <div key={`header-${item.level}`} className="pb-2 pt-7 text-eyebrow text-ink-quiet">
              {levelLabel(item.level)}
            </div>
          );
        }
        const { row, displayTotal, rankIndex } = item;
        const checked = compare.includes(row.slug);
        return (
          <div
            key={row.slug}
            className="grid grid-cols-[24px_1fr_auto_32px] items-start gap-3 border-b border-rule-faint py-5 hover:bg-ground-raised sm:grid-cols-[30px_2.3fr_1.4fr_1.5fr_1fr_40px] sm:items-center sm:gap-[22px]"
          >
            <span className="text-[15.6px] text-ink-quiet">{rank(rankIndex)}</span>
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
              {/* Neutral fill, not accent: this bar is a plain magnitude
                  indicator, not a highlight, and the percent is already
                  printed below it regardless, this is just a quick visual
                  scan aid across rows. Accent red stays reserved for
                  actual emphasis (the compare button, active nav/sort). */}
              <div className="h-[2px] w-full bg-track">
                <div className="h-[2px] bg-ink-tertiary" style={{ width: `${Math.min(100, row.inStatePct)}%` }} />
              </div>
              <div className="mt-2 text-[15px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
                In-state {percent(row.inStatePct)}
              </div>
            </div>
            <div className="text-right">
              {/* Falls through to a plain money() render the moment there's
                  any real dollar figure to show, outside spending included,
                  so this only ever replaces a genuinely unbacked $0, never
                  a candidate's own real numbers. */}
              {!row.hasFilings && displayTotal === 0 ? (
                <span className="text-[15.6px] italic text-ink-quiet">{NO_FILINGS_LABEL}</span>
              ) : (
                <span className="text-roster-amount tabular-nums text-ink">{money(displayTotal)}</span>
              )}
            </div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 border-t border-rule-faint pt-5 text-[15px] text-ink-quiet">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="disabled:opacity-30"
          >
            ← Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

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
