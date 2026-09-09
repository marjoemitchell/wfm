"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money, formatDate } from "@/lib/format";
import PartyChip from "@/components/roster/PartyChip";
import type { Party } from "@/lib/generated/prisma/enums";

type DonorDetail = {
  donor: {
    name: string;
    sector: string;
    employer: string | null;
    city: string;
    state: string;
    fecCommitteeId: string | null;
    committeeDesignation: string | null;
    committeeOrgType: string | null;
    registeredSince: string | null;
    jfcParticipants: { committeeId: string; name: string; amount: number }[] | null;
  };
  totalGiven: number;
  recipients: number;
  rows: { politician: { slug: string; name: string; office: string; party: Party }; amount: number; date: string }[];
};

export default function DonorModal({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  // Keyed by slug so a stale response for a previously-open donor is never
  // shown while a new one is loading — `data` below only renders when its
  // slug matches the one currently requested.
  const [entry, setEntry] = useState<{ slug: string; detail: DonorDetail } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/donor/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setEntry({ slug, detail: json });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, onClose]);

  if (!slug) return null;
  const data = entry?.slug === slug ? entry.detail : null;
  const loading = !data;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-[600px] overflow-y-auto bg-ground-panel p-8"
        style={{ border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="text-eyebrow text-accent">{data ? `Donor · ${data.donor.sector}` : "Donor"}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-quiet hover:text-ink">
            ×
          </button>
        </div>

        {loading && <div className="text-body-copy mt-6 text-ink-secondary">Loading…</div>}

        {data && (
          <>
            <h2 className="mt-2 text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.02em" }}>
              {data.donor.name}
            </h2>
            <p className="mt-2 text-[15px] text-ink-secondary">
              {data.donor.employer ? `${data.donor.employer} · ` : ""}
              {data.donor.city}, {data.donor.state}
            </p>

            {(data.donor.committeeDesignation || data.donor.registeredSince) && (
              <p className="mt-3 text-[14px] text-ink-tertiary">
                {[
                  data.donor.committeeDesignation,
                  data.donor.committeeOrgType,
                  data.donor.registeredSince ? `Registered with the FEC since ${new Date(data.donor.registeredSince).getFullYear()}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {data.donor.fecCommitteeId && (
                  <>
                    {" · "}
                    <a
                      href={`https://www.fec.gov/data/committee/${data.donor.fecCommitteeId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      View on FEC.gov ↗
                    </a>
                  </>
                )}
              </p>
            )}

            <div className="mt-5 flex gap-10 border-y border-rule py-4">
              <div>
                <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                  {money(data.totalGiven)}
                </div>
                <div className="text-eyebrow mt-1 text-ink-tertiary">Total given</div>
              </div>
              <div>
                <div className="text-ink" style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>
                  {data.recipients}
                </div>
                <div className="text-eyebrow mt-1 text-ink-tertiary">Recipients</div>
              </div>
            </div>

            {data.donor.jfcParticipants && data.donor.jfcParticipants.length > 0 && (
              <div className="mt-5">
                <div className="text-eyebrow border-b border-rule pb-2 text-ink-quiet">Joint fundraising participants</div>
                <p className="mt-2 text-[12px] text-ink-faint">
                  This committee splits its proceeds with these committees — amounts are its own transfers to each, not
                  money this candidate received directly.
                </p>
                {data.donor.jfcParticipants.map((p) => (
                  <div key={p.committeeId} className="flex items-center justify-between gap-4 border-b border-rule-faint py-3">
                    <div className="truncate text-[15px] text-ink">{p.name}</div>
                    <div className="shrink-0 text-[15px] tabular-nums text-ink">{money(p.amount)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5">
              <div className="text-eyebrow border-b border-rule pb-2 text-ink-quiet">Who they fund</div>
              {data.rows.map((r, i) => (
                <Link
                  // A donor can make several separate contributions to the
                  // same politician, so slug alone isn't a unique key here.
                  key={`${r.politician.slug}-${i}`}
                  href={`/officeholder/${r.politician.slug}`}
                  // Every column is a fixed/relative unit (no `auto`) — each
                  // row is its own independent grid, so an auto-sized amount
                  // column would resize per-row based on that row's own
                  // digit count, shifting the 1fr name column (and the
                  // party badge after it) left/right row to row.
                  className="grid grid-cols-[1fr_100px_100px] items-center gap-4 border-b border-rule-faint py-3 hover:bg-ground-raised"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[16.5px] text-ink">{r.politician.name}</div>
                    <div className="truncate text-[13px] text-ink-tertiary">{r.politician.office}</div>
                  </div>
                  <PartyChip party={r.politician.party} bordered={false} />
                  <div className="text-right">
                    <div className="text-[16px] tabular-nums text-ink">{money(r.amount)}</div>
                    <div className="text-[12px] text-ink-tertiary">{formatDate(r.date)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
