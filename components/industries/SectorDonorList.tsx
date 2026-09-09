"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import DonorModal from "@/components/industries/DonorModal";

export type SectorDonor = {
  slug: string;
  name: string;
  employer: string | null;
  city: string;
  state: string;
  amount: number;
};

export default function SectorDonorList({ donors }: { donors: SectorDonor[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-rule pb-3">
        <span className="text-eyebrow text-ink-quiet">Largest donors</span>
        <span className="text-[11.5px] text-ink-faint">Click a donor for details</span>
      </div>
      {donors.map((d) => (
        <button
          key={d.slug}
          type="button"
          onClick={() => setSelected(d.slug)}
          className="grid w-full grid-cols-[1.7fr_1fr_0.8fr] items-center gap-4 py-4 text-left hover:bg-ground-raised"
        >
          <div>
            <div className="text-donor-row-name text-ink">{d.name}</div>
            {d.employer && <div className="text-[11.5px] text-ink-tertiary">{d.employer}</div>}
          </div>
          <div className="text-[12px] text-ink-secondary">
            {d.city}, {d.state}
          </div>
          <div className="text-right text-[15px] tabular-nums text-ink">{money(d.amount)}</div>
        </button>
      ))}
      <DonorModal slug={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
