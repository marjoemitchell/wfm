import { STATE_LIMITS_EFFECTIVE_DATE, STATE_NOTES, STATE_ROWS, type Tone } from "@/lib/contribution-limits";

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-ink",
  uncapped: "text-[var(--color-gold)]",
  prohibited: "text-accent tracking-[0.04em]",
  muted: "text-ink-secondary",
};

function formatEffectiveDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function StateLimitsTable() {
  return (
    <div className="pt-[54px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[40.8px] text-ink" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
          Montana state law
        </h2>
        <span className="text-[13.8px] text-ink-tertiary">
          Governor, statewide offices, legislature, courts · enforced by the COPP
        </span>
      </div>
      <p className="text-body-copy mt-3 max-w-[640px] text-ink-secondary">
        Montana&apos;s limits don&apos;t vary by committee type the way federal limits do; they vary by the office
        being sought, and apply per election rather than per cycle.
      </p>
      <div className="text-eyebrow border-b border-rule pb-[14px] pt-[26px] text-ink-tertiary">
        Limits per election, {formatEffectiveDate(STATE_LIMITS_EFFECTIVE_DATE)}
      </div>

      <div className="mt-4 overflow-x-auto" role="region" aria-label="Montana contribution limits by office, scroll to see more" tabIndex={0}>
        <table className="w-full min-w-[760px] border-collapse" style={{ tableLayout: "fixed" }}>
          <caption className="sr-only">
            Montana contribution limits per election by source of the money and office sought, effective{" "}
            {formatEffectiveDate(STATE_LIMITS_EFFECTIVE_DATE)}.
          </caption>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-left align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Source of the money
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-right align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Governor / Lt. Governor
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-right align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Other statewide office
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-0 pt-0 text-right align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Legislature & other public office
              </th>
            </tr>
          </thead>
          <tbody>
            {STATE_ROWS.map((row, i) => {
              const isLast = i === STATE_ROWS.length - 1;
              const borderClass = isLast ? "border-accent" : "border-rule-faint";
              const toneClass = TONE_CLASS[row.tone];
              return (
                <tr key={row.source}>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top`}>
                    <span className="text-donor-row-name text-ink">{row.source}</span>
                    <div className="mt-1 text-[13.8px] text-ink-tertiary">{row.description}</div>
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top text-right text-[15.6px] tabular-nums ${toneClass}`}>
                    {row.governor}
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top text-right text-[15.6px] tabular-nums ${toneClass}`}>
                    {row.otherStatewide}
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-0 align-top text-right text-[15.6px] tabular-nums ${toneClass}`}>
                    {row.legislature}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-[26px] text-[13.8px] text-ink-tertiary">
        <span className="flex items-center">
          <span className="mr-[7px] inline-block h-[7px] w-[7px] bg-accent" />
          Prohibited
        </span>
        <span className="flex items-center">
          <span className="mr-[7px] inline-block h-[7px] w-[7px]" style={{ background: "var(--color-gold)" }} />
          Uncapped
        </span>
      </div>

      <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-px border-y border-rule bg-rule">
        {STATE_NOTES.map((note) => (
          <div key={note.title} className="bg-ground px-6 pb-[26px] pt-6">
            <div className="text-[12.6px] uppercase tracking-[0.16em] text-accent">{note.title}</div>
            <p className="mt-2 text-[16.8px] leading-[1.6] text-ink-secondary">{note.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
