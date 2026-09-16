import Link from "next/link";
import { notFound } from "next/navigation";
import { getDonorBySlug, getPoliticianNameBySlug } from "@/lib/queries";
import { money } from "@/lib/format";
import RecipientList from "@/components/donor/RecipientList";
import IndependentExpenditureCandidateList from "@/components/donor/IndependentExpenditureCandidateList";
import FundedByList from "@/components/donor/FundedByList";

export default async function DonorPage(props: PageProps<"/donor/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const fromSlug = typeof searchParams.from === "string" ? searchParams.from : null;
  const fromIndustries = fromSlug === "industries-spending";

  const [data, from] = await Promise.all([
    getDonorBySlug(slug),
    fromSlug && !fromIndustries ? getPoliticianNameBySlug(fromSlug) : Promise.resolve(null),
  ]);
  if (!data) notFound();

  const { donor, rows, totalGiven, recipients, independentExpenditures, funding } = data;
  const hasFunding = funding.rows.length > 0;

  // Direct contributions and independent expenditures are legally distinct
  // categories a donor can do both of at once: it's specifically an
  // independent-expenditure-*only* committee (a "Super PAC" federally, or
  // Montana COPP's "Independent" committee type) that gives up direct
  // giving in exchange for unlimited independent spending; an ordinary
  // PAC, federal or state, can do both, subject to contribution limits on
  // the direct side.
  const hasDirect = rows.length > 0;
  const hasIndependent = independentExpenditures.rows.length > 0;
  // A donor doing both gets no headline stat at all: any single number up
  // top next to the donor's name reads as *the* total for the page, and
  // there is no single total here: these two categories don't sum to
  // anything meaningful. Each one instead gets its dollar figure woven
  // directly into its own section's own description below, where it can't
  // be mistaken for anything but what it is.
  const isMixed = hasDirect && hasIndependent;

  return (
    <div>
      <Link
        href={fromIndustries ? "/industries?view=spending" : from ? `/officeholder/${from.slug}` : "/"}
        className="text-eyebrow inline-block pt-[22px] text-accent"
      >
        ← {fromIndustries ? "Industries" : from ? from.name : "Roster"}
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] items-end gap-[50px] border-b border-accent py-[20px] pb-[40px]">
        <div>
          <div className="text-eyebrow text-accent">Donor · {donor.sector}</div>
          <h1 className="text-donor-page-name mt-2 text-ink">{donor.name}</h1>
          <p className="mt-3 text-[19.8px] text-ink-secondary">
            {donor.employer ? `${donor.employer} · ` : ""}
            {donor.city}, {donor.state}
          </p>
          {(donor.committeeDesignation || donor.registeredSince) && (
            <p className="mt-3 text-[16.8px] text-ink-tertiary">
              {[
                donor.committeeDesignation,
                donor.committeeType,
                donor.committeeOrgType,
                donor.registeredSince ? `Registered with the FEC since ${donor.registeredSince.getFullYear()}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              {donor.fecCommitteeId && (
                <>
                  {" · "}
                  <a
                    href={`https://www.fec.gov/data/committee/${donor.fecCommitteeId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    View on FEC.gov ↗
                  </a>
                </>
              )}
            </p>
          )}
        </div>
        {!isMixed && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {hasDirect && (
              <>
                <div>
                  <div className="text-stat-secondary text-ink">{money(totalGiven)}</div>
                  <div className="text-eyebrow mt-2 text-ink-tertiary">Total given</div>
                </div>
                <div>
                  <div className="text-stat-secondary text-ink">{recipients}</div>
                  <div className="text-eyebrow mt-2 text-ink-tertiary">Recipients</div>
                </div>
              </>
            )}
            {hasIndependent && (
              <>
                <div>
                  <div className="text-stat-secondary text-ink">{money(independentExpenditures.total)}</div>
                  <div className="text-eyebrow mt-2 text-ink-tertiary">Spent independently</div>
                </div>
                <div>
                  <div className="text-stat-secondary text-ink">{independentExpenditures.recipients}</div>
                  <div className="text-eyebrow mt-2 text-ink-tertiary">Candidates</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {donor.jfcParticipants && Array.isArray(donor.jfcParticipants) && donor.jfcParticipants.length > 0 && (
        <div className="pt-9">
          <div className="text-eyebrow border-b border-rule pb-2 text-ink-quiet">Joint fundraising participants</div>
          <p className="mt-2 text-[14.4px] text-ink-faint">
            This committee splits its proceeds with these committees. Amounts are its own transfers to each, not
            money this candidate received directly.
          </p>
          {(donor.jfcParticipants as { committeeId: string; name: string; amount: number }[]).map((p) => (
            <div key={p.committeeId} className="flex items-center justify-between gap-4 border-b border-rule-faint py-3">
              <div className="truncate text-[18px] text-ink">{p.name}</div>
              <div className="shrink-0 text-[18px] tabular-nums text-ink">{money(p.amount)}</div>
            </div>
          ))}
        </div>
      )}

      {hasFunding && (
        <div className="pt-9">
          <FundedByList
            rows={funding.rows}
            total={funding.total}
            funderCount={funding.funderCount}
            spent={totalGiven + independentExpenditures.total}
          />
        </div>
      )}
      {hasDirect && (
        <div className="pt-9">
          <RecipientList rows={rows} total={totalGiven} recipientCount={recipients} showTotal={isMixed} />
        </div>
      )}
      {hasIndependent && (
        <div className="pt-9">
          <IndependentExpenditureCandidateList
            donorName={donor.name}
            rows={independentExpenditures.rows}
            total={independentExpenditures.total}
            candidateCount={independentExpenditures.recipients}
            showTotal={isMixed}
          />
        </div>
      )}
    </div>
  );
}
