/**
 * Brand Directory Configuration
 *
 * This file contains the curated list of brands on Mela.
 *
 * Environment-specific brand IDs are used since UUIDs differ between
 * development/test and production environments.
 *
 * To add a new brand:
 * 1. Get the brand's user UUID from their profile URL (/u/{uuid})
 * 2. Add to brandConfigurationsByEnv.development (and .production when ready)
 * 3. Add brand ID to allBrandIdsByEnv for each environment
 * 4. Set a unique `slug` (lowercase-hyphenated) — this becomes the permanent /brands/:slug URL
 * 5. Set `category` to one of the BRAND_CATEGORIES ids
 * 6. Ensure the user has userType='provider' in Sharetribe Console
 *
 * IMPORTANT: Slugs are permanent. Once a brand page is indexed by Google, changing
 * the slug without a redirect will cause a 404 and lose SEO value.
 *
 * Brand data (name, logo, certifications, etc.) is fetched dynamically
 * from the user's profile using the Marketplace API.
 */

// Get current environment (defaults to 'production' if not set)
const getCurrentEnv = () => {
  const env = process.env.REACT_APP_ENV;
  return env === 'development' || env === 'test' ? 'development' : 'production';
};

/**
 * Ordered category definitions for /brands page sections
 */
export const BRAND_CATEGORIES = [
  { id: 'baby_and_kids',           label: 'Baby & Kids' },
  { id: 'fashion',                 label: 'Fashion' },
  { id: 'beauty_and_wellness',     label: 'Beauty & Wellness' },
  { id: 'jewelry_and_accessories', label: 'Jewelry & Accessories' },
  { id: 'home_and_kitchen',        label: 'Home & Kitchen' },
];

/**
 * Brand Configurations by Environment
 * Maps brand UUID to their featured products, slug, and category
 */
const brandConfigurationsByEnv = {
  development: {
    '68ebd6d5-ffce-4cb9-9605-3b69f2b67152': {
      // Masilo
      slug: 'masilo',
      category: 'baby_and_kids',
      featuredProductIds: [
        '69116f96-9a8e-4e04-8070-dcc99e2e9b02',
        '6911593a-76ac-4f76-8896-e5d15e0f41c1',
        '6904c875-eecf-4633-82f0-19a0ca0173b6',
        '6904c870-d75f-4968-9e61-5c00aca8377b'
      ],
    },
    '68e42d68-8838-48b5-8299-8e01f46280f2': {
      // Baby Forest
      slug: 'baby-forest',
      category: 'baby_and_kids',
      featuredProductIds: [
        '68e47a9b-adc6-4952-b1c7-96971df9a746',
        '68e47a73-d735-4256-94c4-acde5796bc79',
        '68e47aa4-2dd4-493e-b140-b8b8d02bbefb',
        '68e47a6a-5b7d-4fce-8bcc-b3c8481a53ad'
      ],
    },
    '68e58e66-4894-4ea8-b858-fc63a6bb85f6': {
      // aagghhoo
      slug: 'aagghhoo',
      category: 'baby_and_kids',
      featuredProductIds: [],
    },
    '69784c6e-cdf2-45e1-b76d-baad6ed1c776': {
      // ChooseKind
      slug: 'choosekind',
      category: 'baby_and_kids',
      featuredProductIds: [
        '6a1cf257-e981-4882-9fee-76d1c0d24225',
        '6a1cf633-d21c-4399-8a90-452e02b10fcf',
        '6a1cf956-8424-457c-aa68-dc50b797c79f',
        '6a1cf3f9-6264-4b48-a830-e260ac168608'
      ],
    },
    '697c1798-79e9-46e1-a104-c6c09a512c46': {
      // SuperBottoms
      slug: 'superbottoms',
      category: 'baby_and_kids',
      featuredProductIds: [
        '6a12a70c-466f-4e1a-89cb-81b866417cf9',
        '6a1299fe-fdac-4afb-8864-a3e04c944e54',
        '69faa6a3-0eb0-4f9a-a065-2bb5e11d301b',
        '6a12a086-bbe5-4131-8c94-1ea206f8673c'
      ],
    },
    '69f02a02-6330-4240-9035-fbc23bc568f0': {
      // Pluchi
      slug: 'pluchi',
      category: 'baby_and_kids',
      featuredProductIds: [
        '69fea854-4cd3-453d-b346-7000b1bacba1',
        '69fca349-4352-4d0b-83cf-f7701145261a',
        '69faa8af-22b2-401a-aaa1-2788cea4b872',
        '69fab050-5268-453d-a8ca-d246a46e320b'
      ],
    },
    '69f7bbc7-3b97-4244-9444-bc51ed8ec4e9': {
      // Gully Labs
      slug: 'gullylabs',
      category: 'fashion',
      featuredProductIds: [
        '69fa0fb7-6396-45ca-a447-5baa335cd242',
        '69fa0d8c-d047-4b90-ac33-e3c93a2d5735',
        '69fa0e7c-62cc-40fd-a11b-f17ac62b9511',
        '69fa0f2c-740c-4711-a16d-8b40d6e771d7'
      ],
    },
    '69faa719-cc71-4e56-b6c3-48b0f510fecb': {
      // Banjaaran Studio
      slug: 'banjaaran-studio',
      category: 'fashion',
      featuredProductIds: [
        '6a128475-6078-40c7-a598-f07d627897f9',
        '6a12847d-663d-4a7b-803b-610d3360669f',
        '6a128490-fc91-4923-8f96-a841937f51a4',
        '6a1284c5-d461-485b-896e-a69d2c7027fc'
      ],
    },
    '6a134ea4-dc4d-4cdb-9175-5ec00bf6d8fd': {
      // Polite Society
      slug: 'polite-society',
      category: 'fashion',
      featuredProductIds: [
        '6a135fd6-ef90-46d6-b7a6-68214b1640bf',
        '6a13614d-a0b7-4641-8ee1-1976dfacee43',
        '6a135ee2-5161-4a34-80b5-bb430785d71b',
        '6a135c5c-7a11-4d1d-b787-4f8434c6690b'
      ],
    },
    '6a13c498-39f9-4b74-94fb-fc99a19f5a40': {
      // Vilvah Store
      slug: 'vilvah-store',
      category: 'beauty_and_wellness',
      featuredProductIds: [
        '6a13d75a-d4ba-458d-8c46-d09e3851d3b4',
        '6a13d7ab-ea44-4fb0-847b-340cbf97f820',
        '6a13d653-cdc1-484f-83ae-7d2f0c23d8c7',
        '6a13d69b-47ba-4714-9595-b9c3836f9b69'
      ],
    },
    '6a14a6f7-615b-4f52-8725-30c064efe210': {
      // The Alternate India
      slug: 'the-alternate-india',
      category: 'fashion',
      featuredProductIds: [
        '6a14f614-7198-469c-ba20-a1433ea8734e',
        '6a14e81e-4b72-4680-aac0-7dd861abf7fb',
        '6a14fac1-d021-4f15-804a-d5c94c2474eb',
        '6a14b877-8944-45d7-888f-a312c76d1b32'
      ],
    },
    '6a170717-31bf-4e1e-998f-f613e05fd9c1': {
      // Fizzy Goblet
      slug: 'fizzy-goblet',
      category: 'fashion',
      featuredProductIds: [
        '6a17b799-8ef5-4acf-b974-4b8eaa924d7d',
        '6a17b670-be58-47a6-b1be-32562075c9d0',
        '6a18abb2-da32-41e5-9dd9-a6bddb5f519b',
        '6a17b626-c587-4d7e-a935-a2a164163558'
      ],
    },
    '697b81ea-9931-4a57-8b26-be04fe1daecf': {
      // The Nesavu
      slug: 'the-nesavu',
      category: 'baby_and_kids',
      featuredProductIds: [],
    },
    '6a53dc15-d30a-4338-bdaf-b8bc718e54ef': {
      // ISHARYA
      slug: 'isharya',
      category: 'jewelry_and_accessories',
      featuredProductIds: [],
    },
    '6a30bcd4-e078-447d-9064-2cf773961ab9': {
      // Nicobar
      slug: 'nicobar',
      category: 'fashion',
      featuredProductIds: [],
    },
    '6a585154-a59e-4017-ba71-70732df51b71': {
      // Tarinika
      slug: 'tarinika',
      category: 'jewelry_and_accessories',
      featuredProductIds: [],
    },
    '68d8a4e9-533c-4b9c-914d-8b21edb8ee2d': {
      // mela-admin (Test) — no public slug; admin account
      featuredProductIds: [],
    },
  },
  production: {
    // Add production brand UUIDs here with slugs and categories
    // Example:
    // 'prod-uuid-1': {
    //   slug: 'masilo',
    //   category: 'baby_and_kids',
    //   featuredProductIds: ['listing-uuid-1', 'listing-uuid-2'],
    // },
  },
};

/**
 * All brands by environment — the complete public-facing directory
 */
const allBrandIdsByEnv = {
  development: [
    '68ebd6d5-ffce-4cb9-9605-3b69f2b67152', // Masilo
    '68e42d68-8838-48b5-8299-8e01f46280f2', // Baby Forest
    '68e58e66-4894-4ea8-b858-fc63a6bb85f6', // aagghhoo
    '69784c6e-cdf2-45e1-b76d-baad6ed1c776', // choosekind
    '697c1798-79e9-46e1-a104-c6c09a512c46', // superbottoms
    '69f02a02-6330-4240-9035-fbc23bc568f0', // pluchi
    '69f7bbc7-3b97-4244-9444-bc51ed8ec4e9', // gullylabs
    '697b81ea-9931-4a57-8b26-be04fe1daecf', // the-nesavu
    '69faa719-cc71-4e56-b6c3-48b0f510fecb', // banjaaran-studio
    '6a134ea4-dc4d-4cdb-9175-5ec00bf6d8fd', // polite-society
    '6a13c498-39f9-4b74-94fb-fc99a19f5a40', // vilvah-store
    '6a14a6f7-615b-4f52-8725-30c064efe210', // the-alternate-india
    '6a170717-31bf-4e1e-998f-f613e05fd9c1', // fizzy-goblet
    '6a53dc15-d30a-4338-bdaf-b8bc718e54ef', // isharya
    '6a30bcd4-e078-447d-9064-2cf773961ab9', // nicobar
    '6a585154-a59e-4017-ba71-70732df51b71', // tarinika
  ],
  production: [
    // Add production brand UUIDs here
  ],
};

// Export environment-specific configurations
const currentEnv = getCurrentEnv();
export const brandConfigurations = brandConfigurationsByEnv[currentEnv];
export const allBrandIds = allBrandIdsByEnv[currentEnv];

/**
 * Get all brand IDs
 * @returns {Array<string>} Array of all brand UUIDs
 */
export const getAllBrandIds = () => allBrandIds;

/**
 * Count of distinct categories that have at least one brand in the live config.
 * Powers the homepage hero breadth signal (threshold-gated counter) — never
 * counts the empty category buckets.
 * @returns {number}
 */
export const getPopulatedCategoryCount = () => {
  const cats = new Set();
  allBrandIds.forEach(id => {
    const c = brandConfigurations[id]?.category;
    if (c) cats.add(c);
  });
  return cats.size;
};

/**
 * Return `count` randomly selected brand IDs from the full pool.
 * Called fresh on each homepage mount so every page refresh shows different brands.
 * @param {number} count - Number of brands to return
 * @returns {Array<string>}
 */
export const getRandomBrandIds = count => {
  const arr = [...allBrandIds];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
};

/**
 * Curated carousel *display* order for the homepage hero. Follows the canonical
 * 55-brand onboarding ranking in `homepage-hero-prd.md` §12A (multi-designer panel,
 * 2026-07-12), as refined by the 2026-07-13 first-principles critique in §12A.1
 * (content-strategy + craft-legibility lens). Ordering rule: brands whose India-shout
 * is self-evident in a *no-copy* thumbnail come first; brands whose India-ness is a
 * story (not a visual) or that read as generic US-DTC come last (leading with them
 * reinforces "how is this different from Amazon?"). Slugs are §12A/§12A.1 filtered to
 * brands currently in this config, in refined rank order.
 *
 * First-fold refinements (§12A.1) reflected here:
 *   - The Nesavu pulled UP into the fold (silk pattu pavadai = instant visual
 *     India-shout) and placed ahead of Baby Forest.
 *   - Baby Forest pushed OUT of the first fold (ayurveda heritage is a story a
 *     no-copy carousel can't show); retained as the lead breadth-builder.
 *   - Nicobar demoted below the craft brands so it is never the isolated lead slide
 *     (it fails the India-shout test on its own).
 *   - Open decisions #5 (§12A.1, Isharya-vs-Tarinika for the first-fold jewelry
 *     slot) resolved 2026-07-15: Tarinika takes the slot — temple-inspired design
 *     reads as a stronger traditional India-shout than Isharya's global-editorial
 *     styling. Isharya demoted to the breadth-builder tier.
 *
 * NOTE: this is the *display* order among live brands, distinct from §12A's
 * *onboarding/supply* order. Not-yet-ingested first-fold brands — Suta (#2),
 * Kaunteya (#6), House of Chikankari (#8) — are absent until they land. Unlisted
 * brands are appended in config order so nothing is ever dropped.
 */
const CURATED_BRAND_SLUG_ORDER = [
  // First fold — self-evident India-shout in a no-copy thumbnail (§12A.1)
  'fizzy-goblet',        // §12A #1
  'tarinika',            // resolves Open decisions #5 (2026-07-15): jewelry slot, temple-inspired India-shout
  'the-nesavu',          // §12A.1 first-fold (replaces Baby Forest as the baby visual)
  'nicobar',             // §12A.1 first-fold, demoted — never the isolated lead slide
  'banjaaran-studio',    // §12A #7
  // Breadth builders — craft-legible but not first-fold visual proof
  'baby-forest',         // §12A #5, pulled from the fold (§12A.1); lead breadth-builder
  'isharya',             // demoted from jewelry slot (Open decisions #5, 2026-07-15) — global-editorial styling reads generic without copy
  'gullylabs',           // §12A #21
  'vilvah-store',        // §12A #26
  'aagghhoo',            // §12A #29
  'masilo',              // §12A #33
  'the-alternate-india', // §12A #34
  // Tier 4 — Western-styled; featuring in the first fold reinforces F-002
  'superbottoms',        // §12A #44
  'pluchi',              // §12A #45
  'choosekind',          // §12A #46
  'polite-society',      // §12A #47
];

/**
 * Return `count` brand IDs in the curated hero order (see CURATED_BRAND_SLUG_ORDER).
 * @param {number} count - Number of brands to return
 * @returns {Array<string>}
 */
export const getCuratedBrandIds = count => {
  const idBySlug = {};
  allBrandIds.forEach(id => {
    const slug = brandConfigurations[id]?.slug;
    if (slug) idBySlug[slug] = id;
  });
  const ordered = CURATED_BRAND_SLUG_ORDER.map(slug => idBySlug[slug]).filter(Boolean);
  const remaining = allBrandIds.filter(id => !ordered.includes(id));
  const full = [...ordered, ...remaining];
  return typeof count === 'number' ? full.slice(0, Math.min(count, full.length)) : full;
};

/**
 * Get paginated brand IDs
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Items per page
 * @returns {Object} { brandIds, totalPages, totalItems, page, perPage }
 */
export const getPaginatedBrandIds = (page = 1, perPage = 24) => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    brandIds: allBrandIds.slice(startIndex, endIndex),
    totalPages: Math.ceil(allBrandIds.length / perPage),
    totalItems: allBrandIds.length,
    page,
    perPage,
  };
};

/**
 * Get all featured product IDs for a set of brands
 * Used for batch fetching products in BrandsPage.duck.js
 * @param {Array<string>} brandIds - Array of brand UUIDs
 * @returns {Array<string>} Array of listing UUIDs
 */
export const getFeaturedProductIds = brandIds => {
  return brandIds.flatMap(brandId => brandConfigurations[brandId]?.featuredProductIds || []);
};

/**
 * Get brand configuration
 * @param {string} brandId - Brand user UUID
 * @returns {Object} Brand configuration object
 */
export const getBrandConfiguration = brandId => {
  return brandConfigurations[brandId] || { featuredProductIds: [] };
};

/**
 * ================ /brands page section & ordering config ================
 *
 * Grounded in the homepage-hero-prd.md brand-order research/design/critique
 * (2026-07-16): the hero's carousel rubric (no-copy, single-slide-in-
 * isolation) doesn't transfer as-is to the full /brands catalog page, where
 * BrandCardHome already shows tagline/certifications/location. This section
 * adapts it: drops the "needs explanation" penalty entirely (copy is visible
 * here), and uses the remaining axes to pick a small stable "anchor" lead per
 * section instead of ranking every brand.
 */

/**
 * A category needs at least this many *live* brands (with fetched products)
 * to get its own /brands section header. Thinner categories are folded into
 * MORE_TO_DISCOVER_CATEGORY so the page never renders a header over 2-3
 * lonely cards — and a category graduates to its own section automatically
 * as supply grows, with no config change required.
 */
export const MIN_BRANDS_FOR_OWN_SECTION = 5;

/**
 * Combined section for every category currently below MIN_BRANDS_FOR_OWN_SECTION.
 */
export const MORE_TO_DISCOVER_CATEGORY = {
  id: 'more_to_discover',
  label: 'More to Discover',
};

/** A section needs at least this many brands to earn a second anchor slot. */
const MIN_BRANDS_FOR_TWO_ANCHORS = 3;
const MIN_BRANDS_FOR_ONE_ANCHOR = 2;

/**
 * Per-brand scores (1-5) powering /brands anchor selection. Adapted from the
 * hero's India-shout / aspiration / diaspora-pull rubric (homepage-hero-prd.md
 * §12A/§12A.1) — the "needs-explanation" penalty is intentionally dropped
 * here (see block comment above). Keyed by slug, same pattern as
 * CURATED_BRAND_SLUG_ORDER.
 *
 * indiaShout   — how self-evidently "Indian craft" the brand reads at a glance
 * aspiration   — modern/elevated taste appeal, independent of indiaShout.
 *                E.g. ChooseKind scores low indiaShout but high aspiration:
 *                distinctive, cute, contemporary design earns it an anchor
 *                slot on its own merits, not as an India-shout signal.
 * diasporaPull — identity/recognition pull for diaspora shoppers specifically
 */
const BRAND_SCORES = {
  'fizzy-goblet':        { indiaShout: 5, aspiration: 4, diasporaPull: 3 },
  'tarinika':            { indiaShout: 5, aspiration: 3, diasporaPull: 3 },
  'the-nesavu':          { indiaShout: 5, aspiration: 3, diasporaPull: 4 },
  'nicobar':             { indiaShout: 2, aspiration: 5, diasporaPull: 2 },
  'banjaaran-studio':    { indiaShout: 4, aspiration: 4, diasporaPull: 3 },
  'baby-forest':         { indiaShout: 3, aspiration: 3, diasporaPull: 3 },
  'isharya':             { indiaShout: 3, aspiration: 4, diasporaPull: 2 },
  'gullylabs':           { indiaShout: 3, aspiration: 3, diasporaPull: 2 },
  'vilvah-store':        { indiaShout: 3, aspiration: 3, diasporaPull: 2 },
  'aagghhoo':            { indiaShout: 2, aspiration: 3, diasporaPull: 1 },
  'masilo':              { indiaShout: 2, aspiration: 3, diasporaPull: 1 },
  'the-alternate-india': { indiaShout: 3, aspiration: 3, diasporaPull: 2 },
  'superbottoms':        { indiaShout: 1, aspiration: 3, diasporaPull: 1 },
  'pluchi':              { indiaShout: 1, aspiration: 3, diasporaPull: 1 },
  'choosekind':          { indiaShout: 1, aspiration: 5, diasporaPull: 1 },
  'polite-society':      { indiaShout: 1, aspiration: 3, diasporaPull: 1 },
};

// Neutral default for any brand not yet scored, so new/unscored brands render
// (in the rotation tier, never as an anchor pick) instead of erroring.
const DEFAULT_BRAND_SCORE = { indiaShout: 2, aspiration: 3, diasporaPull: 2 };

/**
 * Get a brand's anchor-selection score.
 * @param {string} brandId - Brand user UUID
 * @returns {{indiaShout: number, aspiration: number, diasporaPull: number}}
 */
export const getBrandScore = brandId => {
  const slug = brandConfigurations[brandId]?.slug;
  return (slug && BRAND_SCORES[slug]) || DEFAULT_BRAND_SCORE;
};

/** ISO week number (UTC) — used to seed the rotation tier so it's stable for
 * everyone for a week, then changes, instead of reshuffling on every load. */
const getISOWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const hashString = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

// Deterministic seeded shuffle (linear congruential generator) — same seed
// always produces the same order, unlike Math.random().
const seededShuffle = (arr, seed) => {
  const a = [...arr];
  let s = seed;
  const nextRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Order the brands within one /brands section: up to 2 stable "anchor" cards
 * chosen from BRAND_SCORES — slot 1 = strongest indiaShout, slot 2 =
 * strongest aspiration among the rest, so the lead row is never two
 * craft-heavy picks in a row — followed by the remaining brands in a
 * weekly-seeded (not per-load-random) rotation, seeded independently per
 * section so categories don't all rotate in lockstep.
 * @param {string} sectionId - category id or MORE_TO_DISCOVER_CATEGORY.id
 * @param {Array<string>} brandIds - live brand IDs in this section
 * @returns {Array<string>} ordered brand IDs
 */
export const getOrderedSectionBrandIds = (sectionId, brandIds) => {
  if (brandIds.length === 0) return [];

  const anchorCount =
    brandIds.length >= MIN_BRANDS_FOR_TWO_ANCHORS
      ? 2
      : brandIds.length >= MIN_BRANDS_FOR_ONE_ANCHOR
      ? 1
      : 0;

  const remaining = brandIds.map(id => ({ id, score: getBrandScore(id) }));
  const anchors = [];

  if (anchorCount >= 1) {
    remaining.sort((a, b) => b.score.indiaShout - a.score.indiaShout);
    anchors.push(remaining.shift());
  }
  if (anchorCount >= 2) {
    remaining.sort((a, b) => b.score.aspiration - a.score.aspiration);
    anchors.push(remaining.shift());
  }

  const weekSeed = hashString(`${sectionId}-${getISOWeek()}`);
  const rotated = seededShuffle(
    remaining.map(r => r.id),
    weekSeed
  );

  return [...anchors.map(a => a.id), ...rotated];
};

/**
 * Get the category id for a brand
 * @param {string} brandId - Brand user UUID
 * @returns {string|null}
 */
export const getBrandCategory = brandId => {
  return brandConfigurations[brandId]?.category || null;
};

/**
 * Get brand UUID by slug
 * Used by /brands/:brandSlug route to resolve ProfilePage loadData
 * @param {string} slug - Brand slug (e.g. 'masilo')
 * @returns {string|null} Brand UUID, or null if not found
 */
export const getBrandIdBySlug = slug => {
  if (!slug) return null;
  const entry = Object.entries(brandConfigurations).find(
    ([, config]) => config.slug === slug
  );
  return entry ? entry[0] : null;
};

/**
 * Get brand slug by UUID
 * Used to build canonical URLs from /u/:id for brand users
 * @param {string} brandId - Brand user UUID
 * @returns {string|null} Brand slug, or null if not found
 */
export const getBrandSlugById = brandId => {
  return brandConfigurations[brandId]?.slug || null;
};
