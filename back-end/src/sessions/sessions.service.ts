import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeTimeSlot } from '../common/time-slot.js';
import { parseDateOnly } from '../common/dates.js';
import { IdGeneratorService } from '../prisma/id-generator.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import {
  SessionResponseDto,
  toSessionResponse,
} from './dto/session-response.dto.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ids: IdGeneratorService,
  ) {}

  async create(dto: CreateSessionDto): Promise<SessionResponseDto> {
    const timeSlot = normalizeTimeSlot(dto.time_slot);

    if (dto.session_id && (await this.exists(dto.session_id))) {
      throw new ConflictException(`Session ${dto.session_id} already exists`);
    }

    const slotTaken = await this.prisma.session.findUnique({
      where: {
        workshopId_day_timeSlot: {
          workshopId: dto.workshop_id,
          day: dto.day,
          timeSlot,
        },
      },
      select: { sessionId: true },
    });
    if (slotTaken) {
      throw new ConflictException(
        `Workshop ${dto.workshop_id} already has session ${slotTaken.sessionId} on day ${dto.day} at ${timeSlot}`,
      );
    }

    const sessionId =
      dto.session_id ??
      (await this.ids.next('session', (id) => this.exists(id)));

    const session = await this.prisma.session.create({
      data: {
        sessionId,
        workshopId: dto.workshop_id,
        facilitatorId: dto.facilitator_id,
        topicId: dto.topic_id,
        day: dto.day,
        date: parseDateOnly(dto.date),
        timeSlot,
      },
    });
    return toSessionResponse(session);
  }

  async findOne(sessionId: string): Promise<SessionResponseDto> {
    const session = await this.prisma.session.findUnique({
      where: { sessionId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    return toSessionResponse(session);
  }

  private async exists(sessionId: string): Promise<boolean> {
    const found = await this.prisma.session.findUnique({
      where: { sessionId },
      select: { id: true },
    });
    return found !== null;
  }
}
