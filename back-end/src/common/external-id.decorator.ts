import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

/** Ids owned by this service or by other services: "SES-001", "WS-2025-001", "P-001". */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Trimmed string that looks like a business id (letters, digits, "-" and "_", max 64). */
export function IsBusinessId() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    Matches(ID_PATTERN, {
      message: ({ property }) =>
        `${property} must be 1-64 characters: letters, digits, "-" or "_"`,
    }),
  );
}
