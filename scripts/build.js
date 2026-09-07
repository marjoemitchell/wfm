#!/usr/bin/env node
// Explicit build step (invoked via `npm run build`, not an npm lifecycle
// hook) — Railway's build environment appears to gate/skip root-package
// lifecycle scripts like "postinstall" (no trace of it running in build
// logs), so anything that must actually execute on Railway goes here
// instead. Chromium + its apt dependencies are only needed by the
// copp-ingest job, gated on SERVICE_ROLE so the web app's build doesn't
// pay for it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("node:child_process");

execSync("npx prisma generate", { stdio: "inherit" });

if (process.env.SERVICE_ROLE === "ingest-copp") {
  // TEMP diagnostic: print the exact apt packages Playwright thinks
  // Chromium needs, so they can be declared for the *runtime* image via
  // Railway's RAILPACK_DEPLOY_APT_PACKAGES (Railpack installs build-time
  // apt packages into a layer that doesn't carry into the deploy image).
  try {
    execSync("npx playwright install-deps --dry-run chromium", { stdio: "inherit" });
  } catch {
    // --dry-run exits non-zero when packages are missing, which they will
    // be here — we only want the printed list, not to fail the build.
  }
  execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
}

execSync("npx next build", { stdio: "inherit" });
