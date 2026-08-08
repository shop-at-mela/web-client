/**
 * Run an async `worker` over `items` with at most `limit` in flight at once,
 * returning results in the original order (like Promise.all, but throttled).
 *
 * Why this exists: several brand pages fan out one Marketplace API call per
 * brand (e.g. `sdk.users.show` per curated brand). Firing 24 of them at once
 * on a cold page load spikes past Sharetribe's ~1 req/sec Dev rate limit and
 * earns 429s. Capping concurrency spreads the burst just under the ceiling
 * without changing what data is fetched — imperceptible behind skeleton
 * loaders, but it stops the cold-load spike.
 *
 * `worker` is expected not to throw (callers catch per-item and return a
 * sentinel such as null); if it does throw, the rejection propagates and the
 * remaining queued items are not started.
 *
 * @template T, R
 * @param {Array<T>} items
 * @param {number} limit    max concurrent workers (coerced to >= 1)
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<Array<R>>} results in the same order as `items`
 */
export const mapWithConcurrency = (items, limit, worker) => {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return Promise.resolve([]);

  const results = new Array(list.length);
  const max = Math.max(1, Math.min(limit || 1, list.length));
  let cursor = 0;

  const runNext = async () => {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(list[index], index);
    }
  };

  return Promise.all(Array.from({ length: max }, runNext)).then(() => results);
};
