import { FOOTNOTE_TEXT_PREFIX } from "@/lib/contribution-limits";
import FederalLimitsTable from "@/components/rules/FederalLimitsTable";
import StateLimitsTable from "@/components/rules/StateLimitsTable";

export default function RulesPage() {
  return (
    <div>
      <div className="border-b border-accent py-[38px] pb-[26px]">
        <h1 className="text-page-headline text-ink">How the money moves</h1>
        <p className="text-body-copy mt-3 max-w-[640px] text-ink-secondary" style={{ textWrap: "pretty" }}>
          Two separate bodies of law govern the officeholders in this tracker. Federal rules cover the U.S. Senate
          and House seats; Montana&apos;s own rules, enforced by the Commissioner of Political Practices, cover the
          governor, statewide offices, the legislature and the courts. The caps are an order of magnitude apart.
        </p>
      </div>

      <FederalLimitsTable />
      <StateLimitsTable />

      <p className="mb-[60px] mt-5 max-w-[760px] text-[13.8px] leading-[1.6] text-ink-faint">
        {FOOTNOTE_TEXT_PREFIX}
        <a
          href="https://politicalpractices.mt.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover"
        >
          Commissioner of Political Practices
        </a>
        .
      </p>
    </div>
  );
}
