"use client";

import { useId, useState } from "react";
import { money } from "@/lib/format";
import SectorDonorModal from "@/components/politician/SectorDonorModal";
import OutsideSpendingModal, { type OutsideSpender } from "@/components/politician/OutsideSpendingModal";

const OUTSIDE_KEY = "__outside_spending__";

export default function SectorList({
  sectors,
  politicianSlug,
  politicianName,
  outsideSpending,
}: {
  sectors: { name: string; amount: number; share: number }[];
  politicianSlug: string;
  politicianName: string;
  outsideSpending: { supportTotal: number; opposeTotal: number; spenders: OutsideSpender[] };
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [outsideOpen, setOutsideOpen] = useState(false);
  const [showOutside, setShowOutside] = useState(false);
  const checkboxId = useId();
  const hasOutsideSpending = outsideSpending.spenders.length > 0;

  const itemizedTotal = sectors.reduce((sum, s) => sum + s.amount, 0);
  const items: { key: string; name: string; amount: number; share: number }[] = sectors.map((s) => ({
    key: s.name,
    name: s.name,
    amount: s.amount,
    share: s.share,
  }));
  if (showOutside && hasOutsideSpending) {
    items.push({
      key: OUTSIDE_KEY,
      name: "Outside spending",
      amount: outsideSpending.supportTotal,
      share: itemizedTotal > 0 ? (outsideSpending.supportTotal / itemizedTotal) * 100 : 100,
    });
  }
  items.sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-rule pb-3">
        <span className="text-eyebrow text-ink-quiet">Sector breakdown</span>
        {hasOutsideSpending && (
          <div className="group relative">
            <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-2 text-[14.4px] text-ink-quiet">
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
              Money spent independently by Super PACs and similar committees to help this candidate. Paid to
              vendors, never given to the campaign directly, so it is left out of the sector breakdown by default.
            </div>
          </div>
        )}
      </div>

      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => (item.key === OUTSIDE_KEY ? setOutsideOpen(true) : setSelected(item.name))}
          className="block w-full border-b border-rule-faint py-[15px] text-left hover:bg-ground-raised"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[18.6px] text-ink">{item.name}</span>
            <span className="text-[19.2px] tabular-nums text-ink-secondary">{money(item.amount)}</span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-track">
            <div className="h-[2px] bg-accent" style={{ width: `${Math.min(100, item.share)}%` }} />
          </div>
        </button>
      ))}

      <SectorDonorModal politicianSlug={politicianSlug} sector={selected} onClose={() => setSelected(null)} />
      {hasOutsideSpending && (
        <OutsideSpendingModal
          politicianSlug={politicianSlug}
          politicianName={politicianName}
          outsideSpending={outsideSpending}
          open={outsideOpen}
          onClose={() => setOutsideOpen(false)}
        />
      )}
    </div>
  );
}
