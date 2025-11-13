import { computeRemainingMs } from '../timerService.js';

describe('computeRemainingMs', () => {
  it('returns null when expiresAt missing', () => {
    expect(computeRemainingMs(null as unknown as FirebaseFirestore.Timestamp)).toBeNull();
  });

  it('returns non-negative milliseconds remaining', () => {
    const expiresAt = {
      toMillis: () => Date.now() + 1000
    } as unknown as FirebaseFirestore.Timestamp;
    expect(computeRemainingMs(expiresAt)).toBeGreaterThanOrEqual(0);
  });
});

