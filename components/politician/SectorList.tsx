import Link from "next/link";
import { money } from "@/lib/format";

export default function SectorList({ sectors }: { sectors: { name: string; amount: number; share: number }[] }) {
  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Sector breakdown</div>
      {sectors.map((s) => (
        <Link
          key={s.name}
          href="/industries"
          className="block border-b border-rule-faint py-[15px]"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[15.5px] text-ink">{s.name}</span>
            <span className="text-[16px] tabular-nums text-ink-secondary">{money(s.amount)}</span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-track">
            <div className="h-[2px] bg-accent" style={{ width: `${Math.min(100, s.share)}%` }} />
          </div>
        </Link>
      ))}
    </div>
  );
}
