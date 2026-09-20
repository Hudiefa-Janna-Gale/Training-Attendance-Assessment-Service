export interface Env {
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
}

/** Fails fast at boot instead of on the first request that touches the DB. */
export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const databaseUrl = raw.DATABASE_URL;
  if (
    typeof databaseUrl !== 'string' ||
    !/^postgres(ql)?:\/\//.test(databaseUrl)
  ) {
    throw new Error(
      'DATABASE_URL is required and must be a PostgreSQL connection string (postgresql://user:pass@host:5432/db)',
    );
  }

  const port = Number(raw.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT must be an integer between 1 and 65535 (got "${String(raw.PORT)}")`,
    );
  }

  return {
    ...raw,
    PORT: port,
    CORS_ORIGIN: String(raw.CORS_ORIGIN ?? 'http://localhost:3000'),
  };
}
