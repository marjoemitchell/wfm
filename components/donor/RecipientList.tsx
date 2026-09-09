import Link from "next/link";
import { money, formatDate } from "@/lib/format";
import PartyChip from "@/components/roster/PartyChip";
import type { Party } from "@/lib/generated/prisma/enums";

export type Recipient = {
  politician: { slug: string; name: string; office: string; party: Party };
  amount: number;
  date: Date;
};

export default function RecipientList({ rows }: { rows: Recipient[] }) {
  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Who they fund</div>
      {rows.map((r, i) => (
        <Link
          // A donor can make several separate contributions to the same
          // politician, so slug alone isn't a unique key across rows.
          key={`${r.politician.slug}-${i}`}
          href={`/officeholder/${r.politician.slug}`}
          className="grid grid-cols-[2.2fr_1.2fr_1.4fr_0.8fr] items-center gap-[22px] border-b border-rule-faint py-5 hover:bg-ground-raised"
        >
          <div>
            <div className="text-recipient-name text-ink">{r.politician.name}</div>
            <div className="text-[13.5px] text-ink-tertiary">{r.politician.office}</div>
          </div>
          <div>
            <PartyChip party={r.politician.party} />
          </div>
          <div className="text-[14px] text-ink-secondary">{formatDate(r.date)}</div>
          <div className="text-recipient-name text-right tabular-nums text-ink">{money(r.amount)}</div>
        </Link>
      ))}
    </div>
  );
}
