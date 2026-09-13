#!/usr/bin/env node
// Explicit build step (invoked via `npm run build`, not an npm lifecycle
// hook) — Railway's build environment appears to gate/skip root-package
// lifecycle scripts like "postinstall" (no trace of it running in build
// logs), so anything that must actually execute on Railway goes here
// instead. Chromium + its apt dependencies are only needed by the
// copp-ingest and copp-ingest-ie jobs (both drive a headless browser
// against the COPP portal), gated on SERVICE_ROLE so the web app's build
// doesn't pay for it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("node:child_process");

execSync("npx prisma generate", { stdio: "inherit" });

if (["ingest-copp", "ingest-copp-ie"].includes(process.env.SERVICE_ROLE)) {
  // The apt packages this installs at build time don't carry into
  // Railway's runtime image (Railpack keeps build vs. deploy apt layers
  // separate) — the repo's railpack.json declares that same dependency
  // list under deploy.aptPackages so it lands in the deploy image too.
  // (A RAILPACK_DEPLOY_APT_PACKAGES service variable looked like the
  // intended way to do this instead, but it silently had no effect in
  // practice — a known rough edge, not something specific to this repo.)
  execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
}

execSync("npx next build", { stdio: "inherit" });
