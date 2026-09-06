# Montana Money

A public tracker for Montana officeholders' campaign donors — who funds them, in-state vs. out-of-state, PACs vs. individuals, and industry breakdowns. Built with Next.js (App Router), Prisma/Postgres, and Tailwind.

The original design brief and prototypes this was built from live in [`design/`](design/README.md).

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string (Railway, or any Postgres instance).
   - `FEC_API_KEY` — an OpenFEC key from [api.data.gov/signup](https://api.data.gov/signup) (or leave as `DEMO_KEY` for light testing).
   - `FEC_CYCLE` — the two-year election cycle to track (e.g. `2026`).
2. Install dependencies and set up the database:
   ```bash
   npm install
   npm run db:migrate   # applies the schema and generates the Prisma client
   npm run db:seed      # seeds placeholder Statewide/Legislature/Judicial officeholders
   npm run ingest:fec   # pulls real Montana federal candidates + Schedule A data from the FEC
   ```
3. `npm run dev` and open http://localhost:3000.

## Data sources

- **Federal** (US Senate, US House) — real data from the [OpenFEC API](https://api.open.fec.gov/developers/), pulled by `scripts/ingest-fec.ts`. Re-running `npm run ingest:fec` refreshes it.
- **Statewide, Legislature, Judicial** — Montana's COPP has no public API, so these are fictional placeholder officeholders (`prisma/seed.ts`), clearly marked `source: PLACEHOLDER` in the database and called out in the site footer. Replacing these with real COPP data is the natural next step.
- **Industry/sector classification** is a keyword heuristic (`scripts/sector-crosswalk.ts`), not a real employer crosswalk — see the comment there.

## Project structure

- `app/` — routes: roster (`/`), officeholder/donor detail, industries, compare, donor geography (map).
- `lib/queries.ts` — all data access and aggregation (sector breakdowns, in-state %, industry totals, map data).
- `lib/montana-geo.ts` / `lib/map-layout.ts` — the donor-geography map's real Montana boundary (via `us-atlas` + `d3-geo`) and label-collision layout.
- `prisma/schema.prisma` — Politician / Donor / Contribution.
- `scripts/ingest-fec.ts` — FEC ingestion (safe to re-run; replaces each candidate's contributions).

## Useful commands

```bash
npm run dev          # dev server
npm run build         # production build
npm run lint          # eslint
npm run db:migrate    # prisma migrate dev + generate
npm run db:seed       # seed placeholder officeholders
npm run ingest:fec    # pull live FEC data
```
