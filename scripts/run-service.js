#!/usr/bin/env node
// Single entrypoint for all three Railway services in this project (the
// web app, and the two data-ingestion jobs) so they can all use the same
// default "start" command and be told apart purely by the SERVICE_ROLE
// environment variable — no per-service "Custom Start Command" dashboard
// setting needed. Defaults to "web" so the existing deployment keeps
// working if SERVICE_ROLE is ever unset.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawnSync } = require("node:child_process");

const COMMANDS = {
  web: ["npx", ["next", "start"]],
  "ingest-fec": ["npx", ["tsx", "scripts/ingest-fec.ts"]],
  "ingest-copp": ["npx", ["tsx", "scripts/ingest-copp.ts"]],
};

const role = process.env.SERVICE_ROLE || "web";
const command = COMMANDS[role];

if (!command) {
  console.error(`Unknown SERVICE_ROLE "${role}". Expected one of: ${Object.keys(COMMANDS).join(", ")}`);
  process.exit(1);
}

console.log(`[run-service] SERVICE_ROLE=${role} -> ${command[0]} ${command[1].join(" ")}`);
const result = spawnSync(command[0], command[1], { stdio: "inherit" });
process.exit(result.status ?? 1);
