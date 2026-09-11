"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import PartyChip from "@/components/roster/PartyChip";
import CandidateExpenditureModal, {
  type CandidateExpenditureItem,
  type CandidateExpenditureSummary,
} from "@/components/donor/CandidateExpenditureModal";
import type { Party } from "@/lib/generated/prisma/enums";

export type IndependentExpenditureRow = {
  politician: { slug: string; name: string; office: string; party: Party };
  amount: number;
  date: Date;
  support: boolean;
  description: string | null;
  payee: string | null;
};

export default function IndependentExpenditureCandidateList({
  donorName,
  rows,
}: {
  donorName: string;
  rows: IndependentExpenditureRow[];
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const bySlug = new Map<string, CandidateExpenditureSummary>();
  for (const r of rows) {
    const item: CandidateExpenditureItem = {
      amount: r.amount,
      date: r.date,
      support: r.support,
      description: r.description,
      payee: r.payee,
    };
    const existing = bySlug.get(r.politician.slug);
    if (existing) {
      if (r.support) existing.supportTotal += r.amount;
      else existing.opposeTotal += r.amount;
      existing.items.push(item);
    } else {
      bySlug.set(r.politician.slug, {
        politician: r.politician,
        supportTotal: r.support ? r.amount : 0,
        opposeTotal: r.support ? 0 : r.amount,
        items: [item],
      });
    }
  }
  const candidates = [...bySlug.values()].sort(
    (a, b) => b.supportTotal + b.opposeTotal - (a.supportTotal + a.opposeTotal)
  );
  const selected = selectedSlug ? (bySlug.get(selectedSlug) ?? null) : null;

  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Independent expenditures</div>
      <p className="mt-2 max-w-[640px] text-[16.2px] text-ink-tertiary">
        Money spent supporting or opposing a candidate, paid directly to vendors rather than given to their
        campaign. By law, an independent-expenditure committee can&apos;t coordinate with or donate to the
        candidates it spends on.
      </p>
      {candidates.map((c) => (
        <button
          key={c.politician.slug}
          type="button"
          onClick={() => setSelectedSlug(c.politician.slug)}
          className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-faint py-5 text-left hover:bg-ground-raised sm:grid-cols-[2fr_1fr_1fr] sm:gap-[22px]"
        >
          <div className="min-w-0">
            <div className="text-recipient-name text-ink">{c.politician.name}</div>
            <div className="text-[16.2px] text-ink-tertiary">{c.politician.office}</div>
          </div>
          <div className="hidden sm:block">
            <PartyChip party={c.politician.party} />
          </div>
          <div className="text-right">
            {c.supportTotal > 0 && <div className="text-recipient-name tabular-nums text-ink">{money(c.supportTotal)} for</div>}
            {c.opposeTotal > 0 && <div className="text-recipient-name tabular-nums text-ink">{money(c.opposeTotal)} against</div>}
          </div>
        </button>
      ))}

      <CandidateExpenditureModal donorName={donorName} summary={selected} onClose={() => setSelectedSlug(null)} />
    </div>
  );
}
