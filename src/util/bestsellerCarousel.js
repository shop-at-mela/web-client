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
