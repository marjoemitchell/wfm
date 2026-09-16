import { getDataProvenance } from "@/lib/queries";

// Without an explicit timeZone this renders in the server's own timezone
// (UTC on Railway), not Montana's: an ingest that runs late in the day
// Mountain time can already be past midnight UTC, showing a date that's
// still "tomorrow" to a Montana reader. Montana is Mountain time
// year-round in practice (it observes DST, so this stays correct across
// the March/November change instead of hardcoding a fixed UTC offset).
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Denver" });
}

export default async function Footer() {
  const { fecUpdatedAt, coppUpdatedAt } = await getDataProvenance();
  const fecLine = fecUpdatedAt ? `FEC filings through ${formatDate(fecUpdatedAt)}` : null;
  const coppLine = coppUpdatedAt ? `Montana COPP filings through ${formatDate(coppUpdatedAt)}` : null;
  const sourceLine = [fecLine, coppLine].filter(Boolean).join(". ");

  return (
    <footer className="mt-10 border-t border-rule pt-5 pb-10">
      <div className="flex flex-wrap justify-between gap-2 text-[15.6px] text-ink-faint" style={{ letterSpacing: "0.08em" }}>
        <span>Who Funds Montana</span>
        <span>{sourceLine ? `Source: ${sourceLine}.` : "Data has not been ingested yet."}</span>
      </div>
    </footer>
  );
}
