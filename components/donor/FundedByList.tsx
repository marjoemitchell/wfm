import Link from "next/link";
import { money, formatDate } from "@/lib/format";

export type FundingRow = {
  funderName: string;
  funderCity: string;
  funderState: string;
  funderType: string;
  amount: number;
  date: Date;
  // Set only when the funder itself resolved to a committee we track as
  // its own donor: lets the row link straight to that committee's page.
  // Null for an individual funder, or a committee we haven't matched.
  funderSlug: string | null;
};

export default function FundedByList({
  rows,
  total,
  funderCount,
  spent,
}: {
  rows: FundingRow[];
  total: number;
  funderCount: number;
  // Direct contributions plus independent expenditures combined: either
  // one on its own can be spent or given with no disclosed funding behind
  // it, so both count toward the same flag rather than each getting its
  // own. Always provided; a committee with nothing tracked going out will
  // just be 0, which never exceeds a real funding total, so the flag
  // naturally stays quiet rather than needing a separate on/off switch.
  spent: number;
}) {
  const gap = spent > total;

  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Funded by</div>
      <p className="mt-2 max-w-[640px] text-[16.2px] text-ink-tertiary">
        {money(total)} disclosed from {funderCount} funder{funderCount === 1 ? "" : "s"} in Montana&apos;s own
        filings: this committee&apos;s own donors, not who it gives to.
      </p>

      {gap && (
        <div className="mt-4 border-l-2 py-1 pl-4" style={{ borderColor: "var(--color-gold)" }}>
          <p className="max-w-[640px] text-[15.6px] leading-[1.6] text-ink-secondary">
            <span style={{ color: "var(--color-gold)" }}>{money(spent - total)} unaccounted for.</span>{" "}
            This committee has given or spent {money(spent)} in Montana races but disclosed only {money(total)} in
            funding. Montana&apos;s filings don&apos;t show where the rest came from.{" "}
            <a href="/rules#dark-money" className="text-accent hover:text-accent-hover">
              How this happens →
            </a>
          </p>
        </div>
      )}

      {rows.map((r, i) => {
        const rowContent = (
          <>
            <div className="min-w-0">
              <div className="text-recipient-name text-ink">{r.funderName}</div>
              <div className="text-[16.2px] text-ink-tertiary">
                {r.funderCity}, {r.funderState}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[15.6px] text-ink-secondary sm:hidden">
                <span>{r.funderType}</span>
                <span>·</span>
                <span>{formatDate(r.date)}</span>
              </div>
            </div>
            <div className="hidden text-[15.6px] text-ink-secondary sm:block">{r.funderType}</div>
            <div className="hidden text-[16.8px] text-ink-secondary sm:block">{formatDate(r.date)}</div>
            <div className="text-recipient-name text-right tabular-nums text-ink">{money(r.amount)}</div>
          </>
        );
        const rowLayout = "grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-faint py-5 sm:grid-cols-[2.2fr_1.4fr_1.2fr_0.8fr] sm:gap-[22px]";
        const key = `${r.funderName}-${i}`;

        return r.funderSlug ? (
          <Link key={key} href={`/donor/${r.funderSlug}`} className={`${rowLayout} hover:bg-ground-raised`}>
            {rowContent}
          </Link>
        ) : (
          <div key={key} className={rowLayout}>
            {rowContent}
          </div>
        );
      })}
    </div>
  );
}
