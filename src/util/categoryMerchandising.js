/**
 * categoryMerchandising.js
 *
 * P1.2 category-page merchandising rules (storefront-validation-readiness-prd.md):
 * brand-diversity cap and utility/basic-item demotion for /categories/:level1 grids.
 */

// No listing-level "utility/basic vs hero" classifier exists in the data today (see the
// PRD's own §8 risk log — this is a known gap, not solved by the P1.1b brand-profile
// seeding, which is brand-level not per-listing). Until real category inventory metadata
// exists, price is used as an explicit, documented heuristic proxy — the PRD's own
// problem statement identifies the symptom as "$3 utility items ranked high", so a low
// USD price threshold is the same signal a human reviewer used to spot the problem.
export const UTILITY_ITEM_PRICE_THRESHOLD_CENTS = 2500; // $25

/**
 * Heuristic only — see module docstring. Not a real product-type classification.
 * @param {Object} listing
 * @returns {boolean}
 */
export const isUtilityItem = listing => {
  const amount = listing?.attributes?.price?.amount;
  return typeof amount === 'number' && amount > 0 && amount < UTILITY_ITEM_PRICE_THRESHOLD_CENTS;
};

/**
 * Reorders `items` so that at most `maxRun` consecutive items share the same brand key.
 * Only pulls an item out of order when leaving it in place would violate the cap — the
 * next-earliest item (by original priority) from a different brand is pulled forward
 * instead, and the deferred item is revisited in a later round. This means an input that
 * already satisfies the cap comes back completely unchanged, rather than being
 * needlessly reshuffled by brand.
 *
 * When only one brand remains, the cap cannot be honored (see the PRD's own "Single-brand
 * categories" risk note) — the algorithm falls through to continuing that brand rather
 * than stalling.
 *
 * @param {Array} items
 * @param {(item: any) => string} getBrandKey
 * @param {number} maxRun
 * @returns {Array} reordered copy of `items`
 */
export const capConsecutiveBrandRuns = (items, getBrandKey, maxRun) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const remaining = items.map(item => ({ item, brand: getBrandKey(item) }));
  const result = [];
  let lastBrand = null;
  let runLength = 0;

  while (remaining.length > 0) {
    let pickIndex = remaining.findIndex(entry => !(entry.brand === lastBrand && runLength >= maxRun));

    // Every remaining item belongs to the currently-capped brand (single brand left) —
    // continue it anyway rather than stalling; diversity rules can't fix thin categories.
    if (pickIndex === -1) pickIndex = 0;

    const [picked] = remaining.splice(pickIndex, 1);
    result.push(picked.item);

    if (picked.brand === lastBrand) {
      runLength += 1;
    } else {
      lastBrand = picked.brand;
      runLength = 1;
    }
  }

  return result;
};

/**
 * Full P1.2 ranking pass for a category grid: hero products first (demoting the
 * price-heuristic "utility" items), then brand-diversity capped.
 *
 * @param {Array} listings
 * @param {number} [maxConsecutiveSameBrand=4]
 * @returns {Array} reordered copy of `listings`
 */
export const applyCategoryMerchandising = (listings, maxConsecutiveSameBrand = 4) => {
  if (!Array.isArray(listings) || listings.length === 0) return [];

  const heroFirst = listings
    .slice()
    .sort((a, b) => Number(isUtilityItem(a)) - Number(isUtilityItem(b)));

  return capConsecutiveBrandRuns(
    heroFirst,
    listing => listing?.author?.id?.uuid || listing?.id?.uuid,
    maxConsecutiveSameBrand
  );
};
