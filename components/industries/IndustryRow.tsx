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
      className="grid grid-cols-[30px_1.5fr_2fr_1fr] items-center gap-6 border-b border-rule-faint py-[22px] hover:bg-ground-raised"
    >
      <span className="text-[11px] text-ink-quiet">{rank(index)}</span>
      <div>
        <div className="text-[23px] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {row.sector}
        </div>
        <div className="text-[11.5px] text-ink-tertiary">
          {row.donorCount} {row.donorCount === 1 ? "donor" : "donors"} tracked
        </div>
      </div>
      <div>
        <p className="mb-[10px] text-[11.5px] text-ink-secondary">
          Top recipient — {row.topRecipient?.name ?? "—"}
        </p>
        <div className="h-[3px] w-full bg-track">
          <div className="h-[3px] bg-accent" style={{ width: `${Math.min(100, barPct)}%` }} />
        </div>
      </div>
      <div className="text-right">
        <div className="text-[17px] tabular-nums text-ink">{money(row.total)}</div>
        <div className="text-[11px] text-ink-quiet">{percent(row.share, 1)} of tracked</div>
      </div>
    </Link>
  );
}
