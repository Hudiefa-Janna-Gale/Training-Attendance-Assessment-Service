import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module.js';
import { AttendanceModule } from '../attendance/attendance.module.js';
import { ResultsModule } from '../results/results.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { BrokerStatus } from './broker-status.js';
import { MessagingController } from './messaging.controller.js';

/** The RabbitMQ face of the service (see patterns.ts); it is switched on by `connectBroker`. */
@Module({
  imports: [SessionsModule, AttendanceModule, AssessmentsModule, ResultsModule],
  controllers: [MessagingController],
  providers: [BrokerStatus],
  exports: [BrokerStatus],
})
export class MessagingModule {}
