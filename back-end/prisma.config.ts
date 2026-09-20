import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer reads the connection string from schema.prisma; the CLI
// (migrate, studio, db seed) gets it from here. `generate` does not connect, so
// a placeholder keeps `npm install` / `docker build` working without a .env.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
