import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Backstop for database errors that slip past the services' explicit checks
 * (typically two concurrent requests racing for the same unique key). Turns
 * them into proper 4xx responses instead of a bare 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const { status, error, message } = this.translate(exception);
    if (status >= 500) this.logger.error(exception.message, exception.stack);

    res.status(status).json({ statusCode: status, message, error });
  }

  private translate(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A record with the same unique value already exists',
        };
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          error: 'Conflict',
          message:
            'The record is referenced by, or references, a record that does not exist',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Record not found',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Unexpected database error',
        };
    }
  }
}
