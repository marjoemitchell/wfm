"use client";

import { useEffect } from "react";
import Link from "next/link";
import { money } from "@/lib/format";

export type OutsideSpender = { slug: string; name: string; city: string; state: string; support: number; oppose: number };

export default function OutsideSpendingModal({
  politicianSlug,
  politicianName,
  outsideSpending,
  open,
  onClose,
}: {
  politicianSlug: string;
  politicianName: string;
  outsideSpending: { supportTotal: number; opposeTotal: number; spenders: OutsideSpender[] };
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

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
          <span className="text-eyebrow text-accent">Outside spending</span>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-quiet hover:text-ink">
            ×
          </button>
        </div>

        <h2 className="mt-2 text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 38, letterSpacing: "-0.02em" }}>
          {politicianName}
        </h2>
        <p className="mt-2 text-[18px] text-ink-secondary">
          Spent independently by Super PACs and similar committees. Paid to vendors, never given to the campaign
          directly, so it is kept separate from the total raised.
        </p>

        <div className="mt-5 flex gap-10 border-y border-rule py-4">
          <div>
            <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 31 }}>
              {money(outsideSpending.supportTotal)}
            </div>
            <div className="text-eyebrow mt-1 text-ink-tertiary">Supporting</div>
          </div>
          {outsideSpending.opposeTotal > 0 && (
            <div>
              <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 31 }}>
                {money(outsideSpending.opposeTotal)}
              </div>
              <div className="text-eyebrow mt-1 text-ink-tertiary">Opposing</div>
            </div>
          )}
        </div>

        <div className="mt-5">
          {outsideSpending.spenders.map((s) => (
            <Link
              key={s.slug}
              href={`/donor/${s.slug}?from=${politicianSlug}`}
              className="flex items-center justify-between gap-3 border-b border-rule-faint py-3 hover:bg-ground-raised"
            >
              <div className="min-w-0">
                <div className="truncate text-[18.6px] text-ink">{s.name}</div>
                <div className="truncate text-[15.6px] text-ink-tertiary">
                  {s.city}, {s.state}
                </div>
              </div>
              <div className="shrink-0 text-right text-[18px] tabular-nums text-ink">
                {s.support > 0 && <div>{money(s.support)} for</div>}
                {s.oppose > 0 && <div>{money(s.oppose)} against</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
