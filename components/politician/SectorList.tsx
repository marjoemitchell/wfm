"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import SectorDonorModal from "@/components/politician/SectorDonorModal";

export default function SectorList({
  sectors,
  politicianSlug,
}: {
  sectors: { name: string; amount: number; share: number }[];
  politicianSlug: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

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
      <SectorDonorModal politicianSlug={politicianSlug} sector={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
