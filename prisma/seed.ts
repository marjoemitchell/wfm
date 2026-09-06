/**
 * Seeds placeholder Statewide, Legislature, and Judicial politicians —
 * Montana's COPP has no public API, so these are fictional stand-ins
 * (source: PLACEHOLDER) shaped like real filings, not real people or money.
 *
 * Federal politicians are intentionally NOT seeded here: they come only
 * from `npm run ingest:fec`, so a real name is never paired with an
 * invented dollar figure. Run this script, then run the FEC ingest.
 */
import "dotenv/config";
import { PrismaClient, Level, Party } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { classifySector } from "../scripts/sector-crosswalk";
import { slugify } from "../lib/format";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const CYCLE = Number(process.env.FEC_CYCLE ?? "2026");

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260906);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));

type PoliticianSeed = {
  slug: string;
  name: string;
  office: string;
  level: Level;
  party: Party;
};

const POLITICIANS: PoliticianSeed[] = [
  { slug: slugify("Ellen Marsh"), name: "Ellen Marsh", office: "Governor", level: "STATEWIDE", party: "R" },
  { slug: slugify("Daniel Whitcombe"), name: "Daniel Whitcombe", office: "Attorney General", level: "STATEWIDE", party: "R" },
  { slug: slugify("Priya Anand"), name: "Priya Anand", office: "Secretary of State", level: "STATEWIDE", party: "D" },
  { slug: slugify("Marcus Yellowtail"), name: "Marcus Yellowtail", office: "State Auditor", level: "STATEWIDE", party: "D" },
  { slug: slugify("Grace Holloway"), name: "Grace Holloway", office: "Superintendent of Public Instruction", level: "STATEWIDE", party: "N" },
  { slug: slugify("Robert Caldwell"), name: "Robert Caldwell", office: "State Senate — District 12", level: "LEGISLATURE", party: "R" },
  { slug: slugify("Linda Ferris"), name: "Linda Ferris", office: "State House — District 44", level: "LEGISLATURE", party: "R" },
  { slug: slugify("Theresa Nguyen"), name: "Theresa Nguyen", office: "State Senate — District 25", level: "LEGISLATURE", party: "D" },
  { slug: slugify("James Okafor"), name: "James Okafor", office: "State House — District 61", level: "LEGISLATURE", party: "D" },
  { slug: slugify("Miriam Kessler"), name: "Miriam Kessler", office: "Montana Supreme Court — Chief Justice", level: "JUDICIAL", party: "N" },
  { slug: slugify("Wendell Stroud"), name: "Wendell Stroud", office: "Montana Supreme Court — Associate Justice", level: "JUDICIAL", party: "N" },
];

type DonorSeed = {
  name: string;
  employer: string | null;
  occupation: string | null;
  city: string;
  state: string;
  isPac: boolean;
};

const MT_CITIES: [string, string][] = [
  ["Helena", "MT"], ["Billings", "MT"], ["Missoula", "MT"], ["Great Falls", "MT"],
  ["Bozeman", "MT"], ["Butte", "MT"], ["Kalispell", "MT"], ["Havre", "MT"],
  ["Miles City", "MT"], ["Livingston", "MT"], ["Whitefish", "MT"], ["Lewistown", "MT"],
  ["Hamilton", "MT"], ["Polson", "MT"], ["Dillon", "MT"], ["Belgrade", "MT"],
];

const OUT_OF_STATE_CITIES: [string, string][] = [
  ["Seattle", "WA"], ["Denver", "CO"], ["San Francisco", "CA"], ["Los Angeles", "CA"],
  ["New York", "NY"], ["Chicago", "IL"], ["Dallas", "TX"], ["Salt Lake City", "UT"],
  ["Phoenix", "AZ"], ["Minneapolis", "MN"], ["Washington", "DC"], ["Portland", "OR"],
];

const INDIVIDUAL_DONORS: Omit<DonorSeed, "isPac">[] = [
  { name: "Carol Hendricks", employer: "Big Sky Ranch Co.", occupation: "Rancher", city: "Bozeman", state: "MT" },
  { name: "Walter Fenn", employer: "Fenn & Associates Law", occupation: "Attorney", city: "Helena", state: "MT" },
  { name: "Dana Iversen", employer: "St. Peter's Health", occupation: "Physician", city: "Helena", state: "MT" },
  { name: "Michael Ostrander", employer: "First Interstate Bank", occupation: "Banker", city: "Billings", state: "MT" },
  { name: "Susan Fairweather", employer: "Retired", occupation: "Retired", city: "Missoula", state: "MT" },
  { name: "Gary Lindqvist", employer: "Lindqvist Logging", occupation: "Owner", city: "Kalispell", state: "MT" },
  { name: "Patricia Nomee", employer: "Self-employed", occupation: "Consultant", city: "Great Falls", state: "MT" },
  { name: "Thomas Ekwall", employer: "Ekwall Construction", occupation: "Contractor", city: "Bozeman", state: "MT" },
  { name: "Rachel Bissell", employer: "University of Montana", occupation: "Professor", city: "Missoula", state: "MT" },
  { name: "Kevin Draeger", employer: "Draeger Oil & Gas", occupation: "Executive", city: "Billings", state: "MT" },
  { name: "Nancy Whitfeather", employer: "Retired", occupation: "Retired", city: "Livingston", state: "MT" },
  { name: "Steven Ambrose", employer: "Glacier Wealth Partners", occupation: "Financial Advisor", city: "Whitefish", state: "MT" },
  { name: "Linda Marchetti", employer: "Marchetti Realty", occupation: "Real Estate Broker", city: "Bozeman", state: "MT" },
  { name: "Douglas Yellow Kidney", employer: "Self-employed", occupation: "Farmer", city: "Havre", state: "MT" },
  { name: "Cheryl Osgood", employer: "Billings Clinic", occupation: "Nurse", city: "Billings", state: "MT" },
  { name: "Brian Talcott", employer: "Talcott Software", occupation: "Engineer", city: "Missoula", state: "MT" },
  { name: "Ellen Prewitt", employer: "Not employed", occupation: "Homemaker", city: "Hamilton", state: "MT" },
  { name: "Roger Duquette", employer: "Duquette Cattle Co.", occupation: "Rancher", city: "Miles City", state: "MT" },
  { name: "Jennifer Ashcroft", employer: "Ashcroft & Ashcroft PLLC", occupation: "Attorney", city: "Helena", state: "MT" },
  { name: "Peter Volkmann", employer: "Retired", occupation: "Retired", city: "Polson", state: "MT" },
  { name: "Melissa Grantham", employer: "Amazon", occupation: "Product Manager", city: "Seattle", state: "WA" },
  { name: "Charles Ripp", employer: "Ripp Capital Management", occupation: "Investor", city: "San Francisco", state: "CA" },
  { name: "Diane Kowalczyk", employer: "Self-employed", occupation: "Consultant", city: "Denver", state: "CO" },
  { name: "Harold Steinbeck", employer: "Steinbeck Oil", occupation: "Executive", city: "Dallas", state: "TX" },
  { name: "Angela Whitmore", employer: "Whitmore Family Foundation", occupation: "Philanthropist", city: "New York", state: "NY" },
  { name: "Frank Delgado", employer: "Retired", occupation: "Retired", city: "Phoenix", state: "AZ" },
  { name: "Barbara Sund", employer: "Northwest Health Partners", occupation: "Physician", city: "Portland", state: "OR" },
  { name: "Gregory Alvarado", employer: "Alvarado Law Group", occupation: "Attorney", city: "Chicago", state: "IL" },
  { name: "Karen Fitzsimmons", employer: "Self-employed", occupation: "Rancher", city: "Salt Lake City", state: "UT" },
  { name: "Vincent Marlowe", employer: "Marlowe Ventures", occupation: "Investor", city: "Minneapolis", state: "MN" },
];

const PAC_DONORS: string[] = [
  "Montana Ranchers & Farmers PAC",
  "Big Sky Energy PAC",
  "Mountain West Realtors Committee",
  "National Trial Lawyers PAC",
  "Frontier Bankers Association PAC",
  "Timber & Trades Political Fund",
  "Montana Education Alliance PAC",
  "Western Conservation Voters PAC",
];

const DONOR_POOL: DonorSeed[] = [
  ...INDIVIDUAL_DONORS.map((d) => ({ ...d, isPac: false })),
  ...PAC_DONORS.map((name) => {
    const [city, state] = pick(MT_CITIES.concat(OUT_OF_STATE_CITIES));
    return { name, employer: null, occupation: null, city, state, isPac: true };
  }),
];

const NOTES = [null, null, null, "Max primary + general", "State contribution limit", null];

async function main() {
  console.log("Clearing existing placeholder data...");
  const placeholderIds = (await db.politician.findMany({ where: { source: "PLACEHOLDER" }, select: { id: true } })).map((p) => p.id);
  await db.contribution.deleteMany({ where: { politicianId: { in: placeholderIds } } });
  await db.politician.deleteMany({ where: { source: "PLACEHOLDER" } });
  await db.donor.deleteMany({ where: { contributions: { none: {} } } });

  console.log("Creating donor pool...");
  const donorIdByName = new Map<string, string>();
  for (const d of DONOR_POOL) {
    const donor = await db.donor.upsert({
      where: { slug: slugify(d.name) },
      create: {
        slug: slugify(d.name),
        name: d.name,
        employer: d.employer,
        occupation: d.occupation,
        city: d.city,
        state: d.state,
        sector: d.isPac ? "Political Committees" : classifySector(d.employer, d.occupation),
      },
      update: {},
    });
    donorIdByName.set(d.name, donor.id);
  }

  console.log("Creating placeholder politicians + contributions...");
  for (const p of POLITICIANS) {
    const donorCount = int(14, 26);
    const shuffled = [...DONOR_POOL].sort(() => rand() - 0.5).slice(0, donorCount);

    let itemizedTotal = 0;
    const contributionsData = shuffled.map((d) => {
      const amount = d.isPac ? int(1000, 10000) : int(250, 5000);
      itemizedTotal += amount;
      const monthsIntoCycle = int(0, 20);
      const date = new Date(CYCLE - 1, 0, 1);
      date.setMonth(date.getMonth() + monthsIntoCycle);
      return {
        donorId: donorIdByName.get(d.name)!,
        amount,
        date,
        note: pick(NOTES),
        isPac: d.isPac,
      };
    });

    const totalRaised = Math.round(itemizedTotal * (1.15 + rand() * 0.35));
    const cashOnHand = Math.round(totalRaised * (0.1 + rand() * 0.3));

    const politician = await db.politician.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        office: p.office,
        level: p.level,
        party: p.party,
        cycle: CYCLE,
        source: "PLACEHOLDER",
        totalRaised,
        cashOnHand,
      },
      update: {
        office: p.office,
        level: p.level,
        party: p.party,
        totalRaised,
        cashOnHand,
      },
    });

    await db.contribution.createMany({
      data: contributionsData.map((c) => ({ ...c, politicianId: politician.id })),
    });
  }

  console.log(`Seeded ${POLITICIANS.length} placeholder politicians.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
