"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";

type SectorDetail = {
  politicianName: string;
  sector: string;
  total: number;
  donorCount: number;
  donors: { slug: string; name: string; employer: string | null; city: string; state: string; amount: number }[];
};

export default function SectorDonorModal({
  politicianSlug,
  sector,
  onClose,
}: {
  politicianSlug: string;
  sector: string | null;
  onClose: () => void;
}) {
  // Keyed by sector so a stale response for a previously-open sector is
  // never shown while a new one is loading.
  const [entry, setEntry] = useState<{ sector: string; detail: SectorDetail } | null>(null);

  useEffect(() => {
    if (!sector) return;
    let cancelled = false;
    fetch(`/api/officeholder/${politicianSlug}/sector?sector=${encodeURIComponent(sector)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setEntry({ sector, detail: json });
      });
    return () => {
      cancelled = true;
    };
  }, [sector, politicianSlug]);

  useEffect(() => {
    if (!sector) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sector, onClose]);

  if (!sector) return null;
  const data = entry?.sector === sector ? entry.detail : null;
  const loading = !data;

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
          <span className="text-eyebrow text-accent">Sector</span>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-quiet hover:text-ink">
            ×
          </button>
        </div>

        {loading && <div className="text-body-copy mt-6 text-ink-secondary">Loading…</div>}

        {data && (
          <>
            <h2 className="mt-2 text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.02em" }}>
              {data.sector}
            </h2>
            <p className="mt-2 text-[15px] text-ink-secondary">Donors to {data.politicianName}</p>

            <div className="mt-5 flex gap-10 border-y border-rule py-4">
              <div>
                <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                  {money(data.total)}
                </div>
                <div className="text-eyebrow mt-1 text-ink-tertiary">Total from sector</div>
              </div>
              <div>
                <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                  {data.donorCount}
                </div>
                <div className="text-eyebrow mt-1 text-ink-tertiary">Donors</div>
              </div>
            </div>

            <div className="mt-5">
              {data.donors.map((d) => (
                <Link
                  key={d.slug}
                  href={`/donor/${d.slug}?from=${politicianSlug}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-faint py-3 hover:bg-ground-raised"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15.5px] text-ink">{d.name}</div>
                    {d.employer && <div className="truncate text-[13px] text-ink-tertiary">{d.employer}</div>}
                    <div className="truncate text-[13px] text-ink-tertiary">
                      {d.city}, {d.state}
                    </div>
                  </div>
                  <div className="text-right text-[16px] tabular-nums text-ink">{money(d.amount)}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
