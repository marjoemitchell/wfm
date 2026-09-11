"use client";

import { useMemo, useState } from "react";
import { getRecentlyViewed } from "@/lib/recently-viewed";

export type PickerOption = {
  slug: string;
  name: string;
  office: string;
  party: "R" | "D" | "N";
  totalRaised: number;
};

const PARTY_LABEL: Record<PickerOption["party"], string> = { R: "REP", D: "DEM", N: "N" };

function ResultRow({ option, onPick }: { option: PickerOption; onPick: (slug: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(option.slug)}
      className="flex w-full items-center justify-between gap-3 py-2 text-left hover:bg-ground-raised"
    >
      <span className="min-w-0">
        <span className="block truncate text-[18px] text-ink">{option.name}</span>
        <span className="block truncate text-[15.6px] text-ink-tertiary">{option.office}</span>
      </span>
      <span className="shrink-0 text-[14.4px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
        {PARTY_LABEL[option.party]}
      </span>
    </button>
  );
}

export default function EmptySlot({
  allPoliticians,
  excludeSlugs,
  onPick,
}: {
  allPoliticians: PickerOption[];
  excludeSlugs: string[];
  onPick: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const available = useMemo(
    () => allPoliticians.filter((p) => !excludeSlugs.includes(p.slug)),
    [allPoliticians, excludeSlugs]
  );

  const results = useMemo(() => {
    if (query.trim().length < 3) return null;
    const q = query.trim().toLowerCase();
    return available.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [available, query]);

  const shortlist = useMemo(() => {
    if (results !== null) return null;
    const byRaised = [...available].sort((a, b) => b.totalRaised - a.totalRaised);
    const topSlugs = new Set(byRaised.slice(0, 4).map((p) => p.slug));
    const recentSlugs = getRecentlyViewed().filter((s) => !topSlugs.has(s) && !excludeSlugs.includes(s));
    const bySlug = new Map(available.map((p) => [p.slug, p]));
    const recent = recentSlugs.map((s) => bySlug.get(s)).filter((p): p is PickerOption => Boolean(p));
    // Recently-viewed float to the top after the top 4 raisers, then
    // everyone else remains reachable by scrolling instead of being cut
    // off; this used to hard-truncate at 6 entries total.
    const recentSet = new Set(recent.map((p) => p.slug));
    const rest = byRaised.filter((p) => !topSlugs.has(p.slug) && !recentSet.has(p.slug));
    return [...byRaised.slice(0, 4), ...recent, ...rest];
  }, [available, results, excludeSlugs]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[280px] w-full flex-col items-center justify-center gap-2 border border-dashed border-border text-ink-quiet hover:border-accent hover:text-ink"
      >
        <span className="text-[26.4px] leading-none">+</span>
        <span className="text-[15.6px] uppercase" style={{ letterSpacing: "0.14em" }}>
          Add officeholder
        </span>
      </button>
    );
  }

  return (
    <div className="min-h-[280px] border border-border bg-ground px-4 py-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results && results.length > 0) onPick(results[0].slug);
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          placeholder="Type a name…"
          className="w-full bg-transparent text-[18px] text-ink placeholder-ink-quiet outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
          aria-label="Cancel"
          className="shrink-0 text-ink-quiet hover:text-ink"
        >
          ×
        </button>
      </div>

      {results !== null ? (
        <div className="mt-2 max-h-[320px] overflow-y-auto">
          {results.length > 0 ? (
            results.map((r) => <ResultRow key={r.slug} option={r} onPick={onPick} />)
          ) : (
            <p className="py-3 text-[16.8px] text-ink-quiet">No matches.</p>
          )}
        </div>
      ) : (
        shortlist &&
        shortlist.length > 0 && (
          <div className="mt-3">
            <div className="text-[14.4px] uppercase text-ink-quiet" style={{ letterSpacing: "0.14em" }}>
              Suggested
            </div>
            <div className="mt-1 max-h-[320px] overflow-y-auto">
              {shortlist.map((s) => (
                <ResultRow key={s.slug} option={s} onPick={onPick} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
