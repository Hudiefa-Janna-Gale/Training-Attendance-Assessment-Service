import { ValidationPipe } from '@nestjs/common';

/**
 * The checks every RabbitMQ request goes through: the same as the HTTP body (unknown properties are
 * rejected, types are checked and converted). `@Payload()` counts as a custom decorator to Nest, so
 * without `validateCustomDecorators` the pipe would skip it and let anything through.
 */
export const rpcValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validateCustomDecorators: true,
  });
