/**
 * Brand Directory Configuration
 *
 * This file contains the curated list of brands featured on Mela.
 * Brands are organized into featured and regular categories.
 *
 * To add a new brand:
 * 1. Get the brand's user UUID from their profile URL (/u/{uuid})
 * 2. Add to brandConfigurations with featuredProductIds
 * 3. Add brand ID to featuredBrandIds or allBrandIds
 * 4. Ensure the user has userType='provider' in Sharetribe Console
 *
 * Brand data (name, logo, certifications, etc.) is fetched dynamically
 * from the user's profile using the Marketplace API.
 */

/**
 * Brand Configurations
 * Maps brand UUID to their featured products and settings
 */
export const brandConfigurations = {
  '68ebd6d5-ffce-4cb9-9605-3b69f2b67152': {
    // Masilo
    featuredProductIds: [
      // Add up to 4 listing UUIDs for this brand's showcase
      // Example: 'listing-uuid-1', 'listing-uuid-2', 'listing-uuid-3', 'listing-uuid-4'
    ],
  },
  '68e42d68-8838-48b5-8299-8e01f46280f2': {
    // Baby Forest
    featuredProductIds: [],
  },
  '68e58e66-4894-4ea8-b858-fc63a6bb85f6': {
    // aagghhoo
    featuredProductIds: [],
  },
  '68d8a4e9-533c-4b9c-914d-8b21edb8ee2d': {
    // mela-admin
    featuredProductIds: [],
  },
};

/**
 * Featured brands - displayed in the top section of the brands page
 * Maximum 6 brands recommended for optimal display
 */
export const featuredBrandIds = [
  // Add featured brand UUIDs here
  // Example: '7e1e3c5a-9b4d-4e6f-8a2c-1d5f6e8b9c0a',
  '68ebd6d5-ffce-4cb9-9605-3b69f2b67152', //Masilo
  '68e42d68-8838-48b5-8299-8e01f46280f2', //Baby Forest
];

/**
 * All brands - complete directory of brands on Mela
 * Includes both featured and non-featured brands
 */
export const allBrandIds = [
  // Add all brand UUIDs here (including featured brands)
  // Example: '7e1e3c5a-9b4d-4e6f-8a2c-1d5f6e8b9c0a',
  // Example: '3f2a1b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
  '68e58e66-4894-4ea8-b858-fc63a6bb85f6', //aagghhoo
  '68d8a4e9-533c-4b9c-914d-8b21edb8ee2d', //mela-admin
];

/**
 * Get featured brand IDs
 * @returns {Array<string>} Array of featured brand UUIDs
 */
export const getFeaturedBrandIds = () => featuredBrandIds;

/**
 * Get all brand IDs
 * @returns {Array<string>} Array of all brand UUIDs
 */
export const getAllBrandIds = () => allBrandIds;

/**
 * Check if a brand is featured
 * @param {string} brandId - Brand user UUID
 * @returns {boolean} True if brand is featured
 */
export const isFeaturedBrand = brandId => featuredBrandIds.includes(brandId);

/**
 * Get paginated brand IDs
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Items per page
 * @returns {Object} { brandIds: Array<string>, totalPages: number, totalItems: number }
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
