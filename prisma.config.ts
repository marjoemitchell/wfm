import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` only needs the schema, not a live connection, but
// loading this config still requires *some* value here — fall back to a
// placeholder so `generate` (e.g. in a build step) works even before
// DATABASE_URL is wired up. Real commands (migrate, the app itself) need
// the real DATABASE_URL set.
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://placeholder/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
