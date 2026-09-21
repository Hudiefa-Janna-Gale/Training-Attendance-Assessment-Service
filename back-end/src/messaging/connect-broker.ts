import type { INestApplication } from '@nestjs/common';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { BrokerStatus } from './broker-status.js';
import { RPC_QUEUE } from './patterns.js';

/**
 * Makes the app listen on the RabbitMQ queue too (HTTP keeps working). It reconnects by itself if
 * the broker goes away. Shared by `main.ts` and the e2e tests, so the tests run what production runs.
 * The caller starts it with `app.startAllMicroservices()`.
 */
export function connectBroker(
  app: INestApplication,
  url: string,
  queue: string = RPC_QUEUE,
) {
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue,
      queueOptions: { durable: true },
      prefetchCount: 20,
    },
  });
  const broker = app.get(BrokerStatus);
  microservice.status.subscribe((state) => broker.set(state));
  return microservice;
}
