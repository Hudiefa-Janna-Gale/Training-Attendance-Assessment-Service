import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BrokerStatus } from '../messaging/broker-status.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly broker: BrokerStatus,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Liveness + database connectivity (used by the Docker healthcheck)',
  })
  @ApiOkResponse({
    schema: {
      example: { status: 'ok', database: 'up', rabbitmq: 'connected' },
      description:
        'rabbitmq: connected, disconnected, or off when no broker is configured',
    },
  })
  @ApiServiceUnavailableResponse({ description: 'Database unreachable' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
    return { status: 'ok', database: 'up', rabbitmq: this.broker.get() };
  }
}
