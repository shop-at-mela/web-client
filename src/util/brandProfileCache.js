/**
 * Shared, TTL'd cache for brand-profile `sdk.users.show` calls.
 *
 * The Marketplace API has no bulk "users by ids" endpoint, so every brand card
 * across the app (homepage hero + featured, /brands, category tiles, spotlight)
 * resolves its brand via a per-brand `users.show`. Hero and featured overlap
 * heavily on the same landing page, and local-state sections re-fetch on every
 * remount — all hammering the Dev rate limit for data that barely changes.
 *
 * Curated brand profiles (logo, tagline, certifications) are effectively static
 * and are public data, so caching the in-flight promise keyed by brand id — and
 * sharing it across sections, remounts, and (on the server) concurrent SSR
 * requests — is safe. Data stays live; it is only deduplicated within the TTL
 * window. A brand-profile edit in Console takes up to TTL_MS to appear, which is
 * an acceptable trade for a curated ~20-brand roster.
 *
 * Failures are never cached (the entry is dropped on rejection) so a transient
 * error doesn't pin a null for the whole window.
 */

const TTL_MS = 15 * 60 * 1000; // 15 minutes

// The field set every brand-card fetch requests. Kept here so all callers stay
// identical and therefore genuinely share cache entries.
const PROFILE_QUERY_PARAMS = {
  include: ['profileImage'],
  'fields.image': ['variants.square-small', 'variants.square-small2x'],
  'fields.user': ['profile', 'metadata'],
};

// brandId -> { ts: number, promise: Promise<doc|null> }
const cache = new Map();

/**
 * Resolve a brand's profile document (`response.data`, i.e. `{ data, included }`)
 * or `null` if the response is malformed. Rejects on network/API error (caller
 * should catch and substitute a sentinel).
 *
 * @param {Object} sdk       Sharetribe SDK instance
 * @param {string} brandId   brand user UUID
 * @returns {Promise<{data: Object, included?: Array}|null>}
 */
export const showBrandProfileDoc = (sdk, brandId) => {
  const cached = cache.get(brandId);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.promise;
  }

  const promise = sdk.users
    .show({ id: brandId, ...PROFILE_QUERY_PARAMS })
    .then(response => (response && response.data ? response.data : null))
    .catch(error => {
      // Don't cache failures — let the next caller retry.
      cache.delete(brandId);
      throw error;
    });

  cache.set(brandId, { ts: Date.now(), promise });
  return promise;
};

/** Test seam: reset cached entries between test cases. */
export const clearBrandProfileCache = () => {
  cache.clear();
};

export const BRAND_PROFILE_CACHE_TTL_MS = TTL_MS;
