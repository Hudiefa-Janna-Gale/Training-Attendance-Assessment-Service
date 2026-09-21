import {
  evaluateWorkshopResult,
  REQUIRED_DAYS,
  requiredDays,
  scoreResult,
} from './grading.js';

describe('scoreResult', () => {
  it('passes at exactly the pass mark and above', () => {
    expect(scoreResult(60, 60)).toBe('PASS');
    expect(scoreResult(82, 60)).toBe('PASS');
    expect(scoreResult(100, 60)).toBe('PASS');
  });

  it('fails below the pass mark', () => {
    expect(scoreResult(59, 60)).toBe('FAIL');
    expect(scoreResult(0, 60)).toBe('FAIL');
  });

  it('honours a custom pass mark', () => {
    expect(scoreResult(70, 75)).toBe('FAIL');
    expect(scoreResult(75, 75)).toBe('PASS');
  });
});

describe('evaluateWorkshopResult (the brief: >= 2 of 3 days AND final score >= 60)', () => {
  const passMark = 60;

  it('requires attending 2 days', () => {
    expect(REQUIRED_DAYS).toBe(2);
  });

  it.each([
    // daysAttended, finalScore, expected
    [3, 82, 'PASS'],
    [2, 60, 'PASS'], // both thresholds met exactly
    [2, 71, 'PASS'],
    [1, 90, 'FAIL'], // great score, too few days
    [0, 100, 'FAIL'],
    [3, 59, 'FAIL'], // full attendance, score just short
    [3, 45, 'FAIL'],
    [1, 45, 'FAIL'], // both short
  ])(
    '%i day(s) attended, score %i → %s',
    (daysAttended, finalScore, expected) => {
      expect(
        evaluateWorkshopResult({ daysAttended, finalScore, passMark }),
      ).toBe(expected);
    },
  );

  it('is FAIL when there is no final score ("otherwise their result is FAIL")', () => {
    expect(
      evaluateWorkshopResult({ daysAttended: 3, finalScore: null, passMark }),
    ).toBe('FAIL');
  });

  describe('a workshop with fewer than 3 days', () => {
    it.each([
      // workshopDays → days that must be attended
      [0, 1], // no session at all: still asks for 1, which nobody can meet
      [1, 1],
      [2, 2],
      [3, 2], // the brief's workshop
      [5, 2], // a longer workshop still needs 2
      [30, 2],
    ])('a %i-day workshop needs %i day(s)', (workshopDays, needed) => {
      expect(requiredDays(workshopDays)).toBe(needed);
    });

    it('a one-day workshop is passed by attending that day and scoring at the pass mark', () => {
      const input = { finalScore: 60, passMark, workshopDays: 1 };
      expect(evaluateWorkshopResult({ ...input, daysAttended: 1 })).toBe(
        'PASS',
      );
      expect(evaluateWorkshopResult({ ...input, daysAttended: 0 })).toBe(
        'FAIL',
      );
    });

    it('a workshop with no session cannot be passed', () => {
      expect(
        evaluateWorkshopResult({
          daysAttended: 0,
          finalScore: 100,
          passMark,
          workshopDays: 0,
        }),
      ).toBe('FAIL');
    });

    it('assumes the brief’s 3 days when the number is not given', () => {
      expect(
        evaluateWorkshopResult({ daysAttended: 1, finalScore: 90, passMark }),
      ).toBe('FAIL');
    });
  });

  it("uses the assessment's own pass mark rather than a hard-coded 60", () => {
    expect(
      evaluateWorkshopResult({ daysAttended: 3, finalScore: 65, passMark: 70 }),
    ).toBe('FAIL');
    expect(
      evaluateWorkshopResult({ daysAttended: 3, finalScore: 65, passMark: 50 }),
    ).toBe('PASS');
  });
});
