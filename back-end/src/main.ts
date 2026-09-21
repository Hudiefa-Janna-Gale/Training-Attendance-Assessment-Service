import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Env } from './config/env.validation.js';
import { connectBroker } from './messaging/connect-broker.js';

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

  const log = new Logger('Bootstrap');

  // The web UI (and other services) can also ask over RabbitMQ. The broker may come up after the
  // service does, so this connects in the background instead of holding the HTTP API back.
  const brokerUrl = config.get<string>('RABBITMQ_URL');
  if (brokerUrl) {
    const queue = config.getOrThrow<string>('RABBITMQ_QUEUE');
    connectBroker(app, brokerUrl, queue);
    app.startAllMicroservices().then(
      () => log.log(`RabbitMQ gateway on queue "${queue}"`),
      (error: unknown) => log.error('RabbitMQ gateway failed to start', error),
    );
  } else {
    log.warn('RABBITMQ_URL is not set: only the HTTP API is available');
  }

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  log.log(
    `API on http://localhost:${port}  ·  docs on http://localhost:${port}/docs`,
  );
}
await bootstrap();
