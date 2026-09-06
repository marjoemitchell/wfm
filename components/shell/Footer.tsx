import { getDataProvenance } from "@/lib/queries";

export default async function Footer() {
  const { fecUpdatedAt } = await getDataProvenance();
  const fecLine = fecUpdatedAt
    ? `Source: FEC filings through ${fecUpdatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`
    : "Federal data has not been ingested yet — run `npm run ingest:fec`.";

  return (
    <footer className="mt-10 border-t border-rule pt-5 pb-10">
      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-ink-faint" style={{ letterSpacing: "0.08em" }}>
        <span>Montana Money</span>
        <span>{fecLine} Federal officeholders only — statewide, legislative, and judicial data is not yet integrated.</span>
      </div>
    </footer>
  );
}
