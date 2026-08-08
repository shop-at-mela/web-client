import { mapWithConcurrency } from './concurrencyLimit';

describe('mapWithConcurrency', () => {
  it('returns [] for empty or non-array input', async () => {
    await expect(mapWithConcurrency([], 3, async x => x)).resolves.toEqual([]);
    await expect(mapWithConcurrency(undefined, 3, async x => x)).resolves.toEqual([]);
    await expect(mapWithConcurrency(null, 3, async x => x)).resolves.toEqual([]);
  });

  it('preserves input order in results regardless of resolve timing', async () => {
    const items = [30, 10, 20, 0, 5];
    const worker = async ms => {
      await new Promise(r => setTimeout(r, ms));
      return ms;
    };
    const result = await mapWithConcurrency(items, 2, worker);
    expect(result).toEqual(items);
  });

  it('passes the index as the second worker argument', async () => {
    const result = await mapWithConcurrency(['a', 'b', 'c'], 5, async (item, i) => `${item}${i}`);
    expect(result).toEqual(['a0', 'b1', 'c2']);
  });

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const worker = async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise(r => setTimeout(r, 5));
      inFlight -= 1;
      return true;
    };
    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 3, worker);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('runs every item exactly once', async () => {
    const seen = [];
    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async n => {
      seen.push(n);
      return n;
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('coerces a limit below 1 up to 1 (still completes)', async () => {
    const result = await mapWithConcurrency([1, 2, 3], 0, async n => n * 2);
    expect(result).toEqual([2, 4, 6]);
  });
});
