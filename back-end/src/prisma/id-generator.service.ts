import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

type IdKind = 'session' | 'assessment';

// Sequence names are constants (never user input), created in the init migration.
const KINDS: Record<IdKind, { prefix: string; nextval: string }> = {
  session: {
    prefix: 'SES',
    nextval: `SELECT nextval('session_id_seq')::int AS n`,
  },
  assessment: {
    prefix: 'ASS',
    nextval: `SELECT nextval('assessment_id_seq')::int AS n`,
  },
};

const MAX_ATTEMPTS = 20;

/**
 * Generates human-readable business ids ("SES-001", "ASS-001") from Postgres
 * sequences, so concurrent requests never receive the same number. Clients may
 * also supply their own ids; if one of those collides with the sequence we
 * simply take the next number.
 */
@Injectable()
export class IdGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async next(
    kind: IdKind,
    exists: (id: string) => Promise<boolean>,
  ): Promise<string> {
    const { prefix, nextval } = KINDS[kind];
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const [{ n }] =
        await this.prisma.$queryRawUnsafe<{ n: number }[]>(nextval);
      const id = `${prefix}-${String(n).padStart(3, '0')}`;
      if (!(await exists(id))) return id;
    }
    throw new Error(
      `Could not generate a free ${kind} id after ${MAX_ATTEMPTS} attempts`,
    );
  }
}
