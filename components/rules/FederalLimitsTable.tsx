import { FEDERAL_CYCLE, FEDERAL_ROWS, type Part, type Tone } from "@/lib/contribution-limits";

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-ink",
  uncapped: "text-[var(--color-gold)]",
  prohibited: "text-accent tracking-[0.04em]",
  muted: "text-ink-secondary",
};

function LimitCell({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className={TONE_CLASS[part.tone]}>
          {part.text}
        </span>
      ))}
    </>
  );
}

export default function FederalLimitsTable() {
  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[40.8px] text-ink" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
          Federal law
        </h2>
        <span className="text-[13.8px] text-ink-tertiary">U.S. Senate and U.S. House · enforced by the FEC</span>
      </div>
      <p className="text-body-copy mt-3 max-w-[640px] text-ink-secondary">
        Money from committees that raise on behalf of federal candidates falls into a handful of legal categories,
        each with its own rules for how much can flow through it, whether it can coordinate with a campaign, and
        whether its donors are ever named publicly.
      </p>
      <div className="text-eyebrow border-b border-rule pb-[14px] pt-[26px] text-ink-tertiary">
        Committee types at a glance
      </div>

      <div className="mt-4 overflow-x-auto" role="region" aria-label="Committee types at a glance, scroll to see more" tabIndex={0}>
        <table className="w-full min-w-[820px] border-collapse" style={{ tableLayout: "fixed" }}>
          <caption className="sr-only">
            Federal committee types and their donation limits, coordination rules, and donor-disclosure requirements
            for the {FEDERAL_CYCLE} cycle.
          </caption>
          <colgroup>
            <col style={{ width: "21%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-left align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Committee type
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-left align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Who controls it?
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-left align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Donation limit?
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-[18px] pt-0 text-left align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Can they coordinate with campaigns?
              </th>
              <th scope="col" className="border-b border-rule pb-3 pr-0 pt-0 text-left align-bottom text-[12.6px] font-normal uppercase tracking-[0.14em] text-ink-tertiary">
                Must disclose donors?
              </th>
            </tr>
          </thead>
          <tbody>
            {FEDERAL_ROWS.map((row, i) => {
              const isLast = i === FEDERAL_ROWS.length - 1;
              const borderClass = isLast ? "border-accent" : "border-rule-faint";
              return (
                <tr key={row.name}>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top`}>
                    <span className="text-donor-row-name text-ink">{row.name}</span>
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top text-[15.6px] text-ink-secondary`}>
                    {row.controlledBy}
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top text-[15.6px]`}>
                    <LimitCell parts={row.donationLimit} />
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-[18px] align-top text-[15.6px]`}>
                    <LimitCell parts={row.coordinate} />
                  </td>
                  <td className={`border-b ${borderClass} py-[17px] pr-0 align-top text-[15.6px]`}>
                    <LimitCell parts={row.discloseDonors} />
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
    </div>
  );
}
