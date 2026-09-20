import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter.js';

/** App-wide behaviour shared by `main.ts` and the e2e tests, so tests exercise what production runs. */
export function configureApp<T extends INestApplication>(app: T): T {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties…
      forbidNonWhitelisted: true, // …and reject the request instead of silently ignoring them
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  return app;
}
