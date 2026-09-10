"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import SectorDonorModal from "@/components/politician/SectorDonorModal";
import OutsideSpendingModal, { type OutsideSpender } from "@/components/politician/OutsideSpendingModal";

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
  const hasOutsideSpending = outsideSpending.spenders.length > 0;

  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Sector breakdown</div>
      {sectors.map((s) => (
        <button
          key={s.name}
          type="button"
          onClick={() => setSelected(s.name)}
          className="block w-full border-b border-rule-faint py-[15px] text-left hover:bg-ground-raised"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[15.5px] text-ink">{s.name}</span>
            <span className="text-[16px] tabular-nums text-ink-secondary">{money(s.amount)}</span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-track">
            <div className="h-[2px] bg-accent" style={{ width: `${Math.min(100, s.share)}%` }} />
          </div>
        </button>
      ))}

      {hasOutsideSpending && (
        <div className="group relative">
          <button
            type="button"
            onClick={() => setOutsideOpen(true)}
            className="block w-full border-b border-rule-faint py-[15px] text-left hover:bg-ground-raised"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[15.5px] text-ink">Outside spending</span>
              <span className="text-[16px] tabular-nums text-ink-secondary">{money(outsideSpending.supportTotal)}</span>
            </div>
            <div className="mt-2 text-[12px] text-ink-quiet">From Super PACs, not counted in total raised</div>
          </button>
          <div className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 w-[280px] rounded border border-rule bg-ground-panel p-3 text-[12px] leading-relaxed text-ink-secondary opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
            Money spent independently by Super PACs and similar committees to help or hurt this candidate. Spent on
            ads and outreach rather than given to the campaign, so it is kept separate from the total raised above.
            Click to see who spent it.
          </div>
        </div>
      )}

      <SectorDonorModal politicianSlug={politicianSlug} sector={selected} onClose={() => setSelected(null)} />
      {hasOutsideSpending && (
        <OutsideSpendingModal
          politicianName={politicianName}
          outsideSpending={outsideSpending}
          open={outsideOpen}
          onClose={() => setOutsideOpen(false)}
        />
      )}
    </div>
  );
}
