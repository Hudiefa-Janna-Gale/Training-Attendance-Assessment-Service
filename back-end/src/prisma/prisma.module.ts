import { Global, Module } from '@nestjs/common';
import { IdGeneratorService } from './id-generator.service.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, IdGeneratorService],
  exports: [PrismaService, IdGeneratorService],
})
export class PrismaModule {}
