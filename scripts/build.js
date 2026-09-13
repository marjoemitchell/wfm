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
  // separate) — the copp-ingest service has RAILPACK_DEPLOY_APT_PACKAGES
  // set with the full Chromium dependency list for that reason.
  execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
}

execSync("npx next build", { stdio: "inherit" });
