import Link from "next/link";
import { money, formatDate } from "@/lib/format";
import PartyChip from "@/components/roster/PartyChip";
import type { Party } from "@/lib/generated/prisma/enums";

export type IndependentExpenditureRow = {
  politician: { slug: string; name: string; office: string; party: Party };
  amount: number;
  date: Date;
  support: boolean;
  description: string | null;
  payee: string | null;
};

export default function IndependentExpenditureList({ rows }: { rows: IndependentExpenditureRow[] }) {
  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Independent expenditures</div>
      <p className="mt-2 max-w-[640px] text-[13.5px] text-ink-tertiary">
        Money spent supporting or opposing a candidate, paid directly to vendors rather than given to their
        campaign — by law, an independent-expenditure committee can&apos;t coordinate with or donate to the
        candidates it spends on.
      </p>
      {rows.map((r, i) => (
        <Link
          // The same PAC can spend on the same candidate multiple times.
          key={`${r.politician.slug}-${i}`}
          href={`/officeholder/${r.politician.slug}`}
          className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-faint py-5 hover:bg-ground-raised sm:grid-cols-[2fr_1fr_1.6fr_0.8fr] sm:gap-[22px]"
        >
          <div className="min-w-0">
            <div className="text-recipient-name text-ink">{r.politician.name}</div>
            <div className="text-[13.5px] text-ink-tertiary">{r.politician.office}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
              <PartyChip party={r.politician.party} />
              <span
                className="text-[11px] uppercase text-ink-quiet"
                style={{ letterSpacing: "0.1em" }}
              >
                {r.support ? "Supporting" : "Opposing"}
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <PartyChip party={r.politician.party} />
            <div className="mt-2 text-[11px] uppercase text-ink-quiet" style={{ letterSpacing: "0.1em" }}>
              {r.support ? "Supporting" : "Opposing"}
            </div>
          </div>
          <div className="hidden text-[13px] text-ink-secondary sm:block">
            {r.description ?? "Independent expenditure"}
            {r.payee ? ` · Paid to ${r.payee}` : ""}
            <div className="mt-1 text-ink-tertiary">{formatDate(r.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-recipient-name tabular-nums text-ink">{money(r.amount)}</div>
            <div className="text-[12px] text-ink-tertiary sm:hidden">{formatDate(r.date)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
