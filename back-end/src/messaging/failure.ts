import { HttpException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { translatePrismaError } from '../prisma/prisma-exception.filter.js';

/** How a failed request is answered over RabbitMQ: the same status and words the HTTP API uses. */
export interface Failure {
  status: number;
  error: string;
  messages: string[];
}

export function toFailure(exception: unknown): Failure {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    const raw =
      typeof body === 'string' ? body : (body as { message?: unknown }).message;
    const label = (body as { error?: unknown } | string).hasOwnProperty('error')
      ? String((body as { error?: unknown }).error)
      : exception.name.replace(/Exception$/, '');
    return {
      status: exception.getStatus(),
      error: label,
      messages: Array.isArray(raw)
        ? raw.map(String)
        : [typeof raw === 'string' ? raw : exception.message],
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const { status, error, message } = translatePrismaError(exception);
    return { status, error, messages: [message] };
  }

  return {
    status: 500,
    error: 'Internal Server Error',
    messages: ['Internal server error'],
  };
}
