/**
 * Utility for fetching listings with bestseller-first strategy.
 * Used by category, occasion, and age-group carousels.
 */

/**
 * Fetch listings with bestseller-first fallback strategy.
 * First tries to fetch bestseller listings; if pool is small, appends non-bestseller results.
 *
 * @param {Object} sdk - Sharetribe SDK instance
 * @param {Object} queryParams - Base query parameters (category, occasion, age_group filter, etc.)
 * @param {number} displayCount - Target number of listings to display
 * @returns {Promise<{pool: Array, allIncluded: Array}>} Combined pool and all included entities
 */
export const fetchBestsellerCarousel = async (sdk, queryParams, displayCount) => {
  try {
    // Step 1: Fetch bestseller listings first
    const bestsellerResponse = await sdk.listings.query({
      ...queryParams,
      pub_isBestseller: true,
      perPage: Math.max(displayCount * 2, 20), // Fetch ahead for deduplication buffer
    });

    let pool = bestsellerResponse.data.data || [];
    let allIncluded = bestsellerResponse.data.included || [];

    // Step 2: If bestseller pool is small, fetch all listings to fill the gap
    if (pool.length < displayCount) {
      try {
        const allResponse = await sdk.listings.query({
          ...queryParams,
          perPage: 50,
        });

        const allListings = allResponse.data.data || [];
        const allResponseIncluded = allResponse.data.included || [];

        // Deduplicate: remove listings already in bestseller set
        const bestsellerIds = new Set(pool.map(l => l.id.uuid));
        const additionalListings = allListings.filter(l => !bestsellerIds.has(l.id.uuid));

        // Combine bestsellers + additional non-bestsellers
        pool = [...pool, ...additionalListings];

        // Merge included data from both responses for complete entity resolution
        allIncluded = [...allIncluded, ...allResponseIncluded];
      } catch (error) {
        // Fallback fetch failed, proceed with bestsellers only
        console.warn('Bestseller carousel fallback fetch failed:', error);
      }
    }

    return { pool, allIncluded };
  } catch (error) {
    console.error('Bestseller carousel fetch failed:', error);
    return { pool: [], allIncluded: [] };
  }
};

// SLA ceiling for a single brand's query within fetchListingsAcrossBrands. A
// brand that hasn't responded within this window contributes nothing rather
// than holding up every other (already-responded) brand — "some data beats
// no data" for a homepage module. Bounds the whole batch to ~this long
// regardless of brand count, since Promise.all only waits for the slowest of
// N promises that are each individually capped at PER_BRAND_TIMEOUT_MS.
export const PER_BRAND_TIMEOUT_MS = 1200;

const EMPTY_BRAND_RESULT = { data: [], included: [] };

// Clears the timeout once the race settles either way — otherwise a fast-
// resolving query still leaves its timer scheduled for the full `ms`, which
// leaks pending timers (harmless individually, but they pile up across many
// per-brand queries and can bleed into unrelated code/tests still running
// when they eventually fire).
const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeout = new Promise(resolve => {
    timeoutId = setTimeout(() => resolve(EMPTY_BRAND_RESULT), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

/**
 * Fetch a few listings from each given brand and merge into one pool.
 *
 * Query-time diversity: guarantees every listed brand gets a fair shot at
 * appearing, instead of relying on marketplace-wide sort order (which can be
 * dominated by whichever single brand has the most matching/most-recent
 * listings — see fetchBestsellerCarousel above). Sharetribe's `authorId`
 * query param only accepts a single UUID (no OR/comma-list support, unlike
 * `ids`), so this is N parallel single-author queries — the same pattern
 * BrandsPage.duck.js already uses (fetchBestsellerListingsForBrand) for
 * per-brand bestseller listings.
 *
 * Each per-brand query is capped at `timeoutMs`: a slow or hanging brand
 * degrades to "no listings from this brand" instead of blocking the whole
 * pool. This bounds the carousel's total fetch time to ~timeoutMs no matter
 * how many brands are configured.
 *
 * @param {Object} sdk - Sharetribe SDK instance
 * @param {Array<string>} brandIds - Brand user UUIDs, e.g. from config/configBrands.js
 * @param {Object} queryParams - Shared query params (filters, include, fields) applied per brand
 * @param {number} perBrandCount - Max listings to fetch per brand
 * @param {number} timeoutMs - Per-brand SLA ceiling in ms
 * @returns {Promise<{pool: Array, allIncluded: Array}>} Combined pool and all included entities
 */
export const fetchListingsAcrossBrands = async (
  sdk,
  brandIds,
  queryParams,
  perBrandCount = 2,
  timeoutMs = PER_BRAND_TIMEOUT_MS
) => {
  const results = await Promise.all(
    brandIds.map(brandId =>
      withTimeout(
        sdk.listings
          .query({ ...queryParams, author_id: brandId, perPage: perBrandCount })
          .then(response => ({
            data: response.data.data || [],
            included: response.data.included || [],
          }))
          .catch(() => EMPTY_BRAND_RESULT),
        timeoutMs
      )
    )
  );

  return {
    pool: results.flatMap(r => r.data),
    allIncluded: results.flatMap(r => r.included),
  };
};
