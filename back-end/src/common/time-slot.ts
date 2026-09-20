import { BadRequestException } from '@nestjs/common';

// "08:00–09:30" — the brief uses an en dash; a plain hyphen is accepted too.
const TIME_SLOT =
  /^([01]\d|2[0-3]):([0-5]\d)\s*[–-]\s*([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates a time slot and returns it in the canonical form "HH:MM–HH:MM",
 * so "08:00 - 09:30" and "08:00–09:30" cannot both be stored for one slot.
 */
export function normalizeTimeSlot(input: string): string {
  const match = TIME_SLOT.exec(input.trim());
  if (!match) {
    throw new BadRequestException(
      'time_slot must look like "08:00–09:30" (24-hour HH:MM–HH:MM)',
    );
  }
  const [, h1, m1, h2, m2] = match;
  if (Number(h1) * 60 + Number(m1) >= Number(h2) * 60 + Number(m2)) {
    throw new BadRequestException('time_slot must end after it starts');
  }
  return `${h1}:${m1}–${h2}:${m2}`;
}
