import { BadRequestException } from '@nestjs/common';
import { normalizeTimeSlot } from './time-slot.js';

describe('normalizeTimeSlot', () => {
  it('keeps the canonical en-dash form as is', () => {
    expect(normalizeTimeSlot('08:00–09:30')).toBe('08:00–09:30');
  });

  it('canonicalises hyphens and surrounding spaces', () => {
    expect(normalizeTimeSlot('08:00-09:30')).toBe('08:00–09:30');
    expect(normalizeTimeSlot('  08:00 - 09:30 ')).toBe('08:00–09:30');
  });

  it.each(['8:00–9:30', '08:00', '08:00–25:00', '08:60–09:00', 'morning', ''])(
    'rejects malformed slot %j',
    (input) => {
      expect(() => normalizeTimeSlot(input)).toThrow(BadRequestException);
    },
  );

  it.each(['10:00–09:00', '09:00–09:00'])(
    'rejects a slot that does not end after it starts (%s)',
    (input) => {
      expect(() => normalizeTimeSlot(input)).toThrow(
        'must end after it starts',
      );
    },
  );
});
