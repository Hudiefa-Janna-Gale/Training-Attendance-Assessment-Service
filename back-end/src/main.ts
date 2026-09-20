import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Env } from './config/env.validation.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((origin) => origin.trim()),
  });
  app.enableShutdownHooks(); // lets Prisma disconnect cleanly on SIGTERM (docker stop)

  const swagger = new DocumentBuilder()
    .setTitle('Training, Attendance & Assessment Service')
    .setDescription(
      'SD-Group 6 — sessions, daily attendance, assessments, scores and final PASS/FAIL results.',
    )
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  new Logger('Bootstrap').log(
    `API on http://localhost:${port}  ·  docs on http://localhost:${port}/docs`,
  );
}
await bootstrap();
