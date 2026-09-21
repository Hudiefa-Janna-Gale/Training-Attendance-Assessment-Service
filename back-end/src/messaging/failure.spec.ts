import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { toFailure } from './failure.js';

describe('toFailure (how a failed request is answered over RabbitMQ)', () => {
  it('keeps the status and words of a NestJS exception, like the HTTP API', () => {
    expect(toFailure(new NotFoundException('Session SES-9 not found'))).toEqual(
      {
        status: 404,
        error: 'Not Found',
        messages: ['Session SES-9 not found'],
      },
    );
    expect(
      toFailure(new ConflictException('Session SES-001 already exists')),
    ).toMatchObject({
      status: 409,
      messages: ['Session SES-001 already exists'],
    });
  });

  it('lists every validation message of a 400', () => {
    expect(
      toFailure(
        new BadRequestException([
          'day must not be greater than 30',
          'date must be in YYYY-MM-DD format',
        ]),
      ),
    ).toEqual({
      status: 400,
      error: 'Bad Request',
      messages: [
        'day must not be greater than 30',
        'date must be in YYYY-MM-DD format',
      ],
    });
  });

  it('turns a database error into the same 4xx the HTTP filter gives', () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'test',
    });
    expect(toFailure(duplicate)).toEqual({
      status: 409,
      error: 'Conflict',
      messages: ['A record with the same unique value already exists'],
    });
  });

  it('hides anything unexpected behind a plain 500', () => {
    expect(toFailure(new Error('password=hunter2 in the stack'))).toEqual({
      status: 500,
      error: 'Internal Server Error',
      messages: ['Internal server error'],
    });
    expect(toFailure('a thrown string').status).toBe(500);
  });
});
