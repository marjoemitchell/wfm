#!/usr/bin/env node
// Runs after every `npm install`. Prisma Client generation is needed by
// every service; the Chromium download (with its apt-level OS
// dependencies) is only needed by the copp-ingest job, so it's gated on
// SERVICE_ROLE to avoid bloating the web app's build.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("node:child_process");

execSync("npx prisma generate", { stdio: "inherit" });

if (process.env.SERVICE_ROLE === "ingest-copp") {
  execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
}
