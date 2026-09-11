import Link from "next/link";
import { money, percent, rank } from "@/lib/format";

export type IndustryRowData = {
  sector: string;
  slug: string;
  total: number;
  share: number;
  donorCount: number;
  topRecipient: { name: string; slug: string } | null;
};

export default function IndustryRow({ row, index }: { row: IndustryRowData; index: number }) {
  const barPct = row.share;

  return (
    <Link
      href={`/industry/${row.slug}`}
      className="grid grid-cols-[24px_1fr_auto] items-start gap-4 border-b border-rule-faint py-[22px] hover:bg-ground-raised sm:grid-cols-[30px_1.5fr_2fr_1fr] sm:items-center sm:gap-6"
    >
      <span className="text-[15.6px] text-ink-quiet">{rank(index)}</span>
      <div className="min-w-0">
        <div className="text-[clamp(18px,4.5vw,27.6px)] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {row.sector}
        </div>
        <div className="text-[16.2px] text-ink-tertiary">
          {row.donorCount} {row.donorCount === 1 ? "donor" : "donors"} tracked
        </div>
        <div className="mt-2 sm:hidden">
          <p className="mb-2 text-[16.2px] text-ink-secondary">Top recipient: {row.topRecipient?.name ?? "None"}</p>
          <div className="h-[3px] w-full bg-track">
            <div className="h-[3px] bg-accent" style={{ width: `${Math.min(100, barPct)}%` }} />
          </div>
        </div>
      </div>
      <div className="hidden sm:block">
        <p className="mb-[10px] text-[16.2px] text-ink-secondary">
          Top recipient: {row.topRecipient?.name ?? "None"}
        </p>
        <div className="h-[3px] w-full bg-track">
          <div className="h-[3px] bg-accent" style={{ width: `${Math.min(100, barPct)}%` }} />
        </div>
      </div>
      <div className="text-right">
        <div className="text-[21.6px] tabular-nums text-ink">{money(row.total)}</div>
        <div className="text-[15.6px] text-ink-quiet">{percent(row.share, 1)} of tracked</div>
      </div>
    </Link>
  );
}
