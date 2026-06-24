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
