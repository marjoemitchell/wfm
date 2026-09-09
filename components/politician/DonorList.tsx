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
      <div className="flex items-baseline justify-between border-b border-rule pb-3">
        <span className="text-eyebrow text-ink-quiet">Largest donors</span>
        <span className="text-[13.5px] text-ink-faint">Open a donor to see everyone they fund</span>
      </div>
      {donors.map((d) => (
        <Link
          key={d.slug}
          href={`/donor/${d.slug}?from=${politicianSlug}`}
          className="grid grid-cols-[1.7fr_1fr_0.8fr] items-center gap-4 py-4 hover:bg-ground-raised"
        >
          <div>
            <div className="text-donor-row-name text-ink">{d.name}</div>
            {d.employer && <div className="text-[13.5px] text-ink-tertiary">{d.employer}</div>}
          </div>
          <div className="text-[14px] text-ink-secondary">
            {d.city}, {d.state}
          </div>
          <div className="text-right text-[16.5px] tabular-nums text-ink">{money(d.amount)}</div>
        </Link>
      ))}
    </div>
  );
}
