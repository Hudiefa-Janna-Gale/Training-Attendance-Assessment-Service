import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import type { RpcExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { toFailure, type Failure } from './failure.js';

/**
 * Turns anything that goes wrong while answering a RabbitMQ request into the `err` of the reply, so
 * the caller gets a status and messages (400 validation, 404 not found, 409 duplicate…) and not the
 * transport's bare "Internal server error". The HTTP filters cannot be used here: there is no
 * HTTP response to write to.
 */
@Catch()
export class RpcFailureFilter implements RpcExceptionFilter {
  private readonly logger = new Logger('RabbitMQ');

  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    const failure: Failure = toFailure(exception);
    if (failure.status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    return throwError(() => failure);
  }
}
