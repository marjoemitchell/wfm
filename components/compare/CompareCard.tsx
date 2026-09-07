import Link from "next/link";
import { money, percent } from "@/lib/format";
import type { Party } from "@/lib/generated/prisma/enums";

const PARTY_COLOR: Record<Party, string> = {
  R: "var(--color-party-r)",
  D: "var(--color-party-d)",
  N: "var(--color-party-n)",
};
const PARTY_LABEL: Record<Party, string> = { R: "REP", D: "DEM", N: "NONPARTISAN" };

export type CompareCardData = {
  politician: { slug: string; name: string; office: string; party: Party; totalRaised: number; cashOnHand: number };
  totalRaisedShare: number;
  inStatePct: number;
  pacPct: number;
  outOfStatePct: number;
  topSectors: { name: string; amount: number }[];
};

export default function CompareCard({ data, onRemove }: { data: CompareCardData; onRemove?: () => void }) {
  const { politician } = data;

  const metrics = [
    { label: "Total raised", value: money(politician.totalRaised), pct: data.totalRaisedShare * 100, color: "var(--color-ink)" },
    { label: "Cash on hand", value: money(politician.cashOnHand), pct: politician.totalRaised > 0 ? (politician.cashOnHand / politician.totalRaised) * 100 : 0, color: "var(--color-ink-secondary)" },
    { label: "In-state", value: percent(data.inStatePct), pct: data.inStatePct, color: "var(--color-accent)" },
    { label: "PAC share", value: percent(data.pacPct), pct: data.pacPct, color: "var(--color-gold)" },
    { label: "Out-of-state", value: percent(data.outOfStatePct), pct: data.outOfStatePct, color: "var(--color-party-d)" },
  ];

  return (
    <div className="bg-ground px-6 pt-6 pb-[26px]">
      <div className="flex items-start justify-between">
        <span className="text-[10.5px] uppercase" style={{ color: PARTY_COLOR[politician.party], letterSpacing: "0.16em" }}>
          {PARTY_LABEL[politician.party]}
        </span>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove ${politician.name}`} className="text-ink-quiet hover:text-ink">
            ×
          </button>
        )}
      </div>
      <Link href={`/officeholder/${politician.slug}`} className="block">
        <div className="text-compare-name mt-2 text-ink">{politician.name}</div>
      </Link>
      <div className="text-[11.5px] text-ink-tertiary">{politician.office}</div>

      <div className="mt-6 flex flex-col gap-[18px]">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase text-ink-quiet" style={{ letterSpacing: "0.14em" }}>
                {m.label}
              </span>
              <span className="text-[15px] tabular-nums text-ink">{m.value}</span>
            </div>
            <div className="mt-1 h-[2px] w-full bg-track">
              <div className="h-[2px]" style={{ width: `${Math.min(100, Math.max(0, m.pct))}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[26px] border-t border-rule pt-4">
        <div className="text-eyebrow text-ink-quiet">Top sectors</div>
        {data.topSectors.map((s) => (
          <div key={s.name} className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-ink-secondary">{s.name}</span>
            <span className="tabular-nums text-ink">{money(s.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
