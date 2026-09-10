"use client";

import { useEffect } from "react";
import Link from "next/link";
import { money, formatDate } from "@/lib/format";
import PartyChip from "@/components/roster/PartyChip";
import type { Party } from "@/lib/generated/prisma/enums";

export type CandidateExpenditureItem = {
  amount: number;
  date: Date;
  support: boolean;
  description: string | null;
  payee: string | null;
};

export type CandidateExpenditureSummary = {
  politician: { slug: string; name: string; office: string; party: Party };
  supportTotal: number;
  opposeTotal: number;
  items: CandidateExpenditureItem[];
};

export default function CandidateExpenditureModal({
  donorName,
  summary,
  onClose,
}: {
  donorName: string;
  summary: CandidateExpenditureSummary | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!summary) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [summary, onClose]);

  if (!summary) return null;
  const { politician } = summary;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-[600px] overflow-y-auto bg-ground-panel p-5 sm:p-8"
        style={{ border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="text-eyebrow text-accent">Independent expenditures</span>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-quiet hover:text-ink">
            ×
          </button>
        </div>

        <Link href={`/officeholder/${politician.slug}`} className="mt-2 block hover:opacity-80">
          <h2 className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.02em" }}>
            {politician.name}
          </h2>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <PartyChip party={politician.party} />
          <span className="text-[13.5px] text-ink-tertiary">{politician.office}</span>
        </div>
        <p className="mt-3 text-[14px] text-ink-secondary">Spent by {donorName}, itemized below.</p>

        <div className="mt-5 flex gap-10 border-y border-rule py-4">
          {summary.supportTotal > 0 && (
            <div>
              <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                {money(summary.supportTotal)}
              </div>
              <div className="text-eyebrow mt-1 text-ink-tertiary">Supporting</div>
            </div>
          )}
          {summary.opposeTotal > 0 && (
            <div>
              <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                {money(summary.opposeTotal)}
              </div>
              <div className="text-eyebrow mt-1 text-ink-tertiary">Opposing</div>
            </div>
          )}
        </div>

        <div className="mt-5">
          {summary.items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] items-start gap-4 border-b border-rule-faint py-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
                  {item.support ? "Supporting" : "Opposing"}
                </div>
                <div className="mt-1 text-[13.5px] text-ink-secondary">
                  {item.description ?? "Independent expenditure"}
                  {item.payee ? ` · Paid to ${item.payee}` : ""}
                </div>
                <div className="mt-1 text-[12px] text-ink-tertiary">{formatDate(item.date)}</div>
              </div>
              <div className="shrink-0 text-right text-[15px] tabular-nums text-ink">{money(item.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
