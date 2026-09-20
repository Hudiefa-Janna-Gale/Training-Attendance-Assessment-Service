import {
  evaluateWorkshopResult,
  REQUIRED_DAYS,
  scoreResult,
  TOTAL_DAYS,
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

describe('evaluateWorkshopResult', () => {
  const passMark = 60;

  it("uses the brief's thresholds (2 of 3 days)", () => {
    expect(TOTAL_DAYS).toBe(3);
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

  it('is PENDING (not FAIL) until a final score exists', () => {
    expect(
      evaluateWorkshopResult({ daysAttended: 3, finalScore: null, passMark }),
    ).toBe('PENDING');
    expect(
      evaluateWorkshopResult({ daysAttended: 0, finalScore: null, passMark }),
    ).toBe('PENDING');
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
