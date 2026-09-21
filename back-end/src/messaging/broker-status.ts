import { Injectable } from '@nestjs/common';

/** Whether the RabbitMQ side is connected, for `/health`: "off" when no broker is configured. */
@Injectable()
export class BrokerStatus {
  private state = 'off';

  set(state: string): void {
    this.state = state;
  }

  get(): string {
    return this.state;
  }
}
