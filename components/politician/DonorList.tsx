import Link from "next/link";
import { money } from "@/lib/format";

export type TopDonor = {
  slug: string;
  name: string;
  employer: string | null;
  city: string;
  state: string;
  amount: number;
};

export default function DonorList({ donors, politicianSlug }: { donors: TopDonor[]; politicianSlug: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule pb-3">
        <span className="text-eyebrow text-ink-quiet">Largest donors</span>
        <span className="text-[16.2px] text-ink-faint">Open a donor to see everyone they fund</span>
      </div>
      {donors.map((d) => (
        <Link
          key={d.slug}
          href={`/donor/${d.slug}?from=${politicianSlug}`}
          className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 hover:bg-ground-raised sm:grid-cols-[1.7fr_1fr_0.8fr]"
        >
          <div className="min-w-0">
            <div className="truncate text-donor-row-name text-ink" title={d.name}>
              {d.name}
            </div>
            {d.employer && <div className="truncate text-[16.2px] text-ink-tertiary">{d.employer}</div>}
            <div className="text-[16.2px] text-ink-tertiary sm:hidden">
              {d.city}, {d.state}
            </div>
          </div>
          <div className="hidden text-[16.8px] text-ink-secondary sm:block">
            {d.city}, {d.state}
          </div>
          <div className="text-right text-[19.8px] tabular-nums text-ink">{money(d.amount)}</div>
        </Link>
      ))}
    </div>
  );
}
