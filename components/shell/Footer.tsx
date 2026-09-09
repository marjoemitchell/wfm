import { getDataProvenance } from "@/lib/queries";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function Footer() {
  const { fecUpdatedAt, coppUpdatedAt } = await getDataProvenance();
  const fecLine = fecUpdatedAt ? `FEC filings through ${formatDate(fecUpdatedAt)}` : null;
  const coppLine = coppUpdatedAt ? `Montana COPP filings through ${formatDate(coppUpdatedAt)}` : null;
  const sourceLine = [fecLine, coppLine].filter(Boolean).join(". ");

  return (
    <footer className="mt-10 border-t border-rule pt-5 pb-10">
      <div className="flex flex-wrap justify-between gap-2 text-[13px] text-ink-faint" style={{ letterSpacing: "0.08em" }}>
        <span>Who Funds Montana</span>
        <span>{sourceLine ? `Source: ${sourceLine}.` : "Data has not been ingested yet."}</span>
      </div>
    </footer>
  );
}
