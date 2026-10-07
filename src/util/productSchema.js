/**
 * Helpers for the Product JSON-LD and meta description on listing pages.
 *
 * Mela is a curated directory, not a retailer: the offer's seller is always the brand, and
 * nothing here asserts that Mela sells, ships or prices the product.
 */

const SEO_DESCRIPTION_MAX_CHARS = 160;
const SEO_DESCRIPTION_SNIPPET_CHARS = 100;

/**
 * The brand as the seller of an offer. Returns undefined without a brand name, so no seller
 * is asserted at all (never Mela, never a made up value).
 *
 * @param {string?} brandName
 * @param {string?} brandStoreUrl the brand's own store URL from its profile, when present
 * @returns {Object|undefined}
 */
export const getOfferSeller = (brandName, brandStoreUrl) => {
  if (!brandName) return undefined;
  const hasUrl = typeof brandStoreUrl === 'string' && /^https?:\/\//i.test(brandStoreUrl);
  return {
    '@type': 'Organization',
    name: brandName,
    ...(hasUrl ? { url: brandStoreUrl } : {}),
  };
};

/**
 * Meta description used when a listing has no `metaDescription` of its own.
 * Neutral by design: no audience, no delivery claim.
 *
 * @param {Object} intl react-intl instance
 * @param {Object} args
 * @param {string} args.title
 * @param {string?} args.brandName
 * @param {string?} args.description listing description, cut to a short snippet
 * @param {string} args.marketplaceName
 * @returns {string} at most 160 characters
 */
export const getSeoDescriptionFallback = (intl, { title, brandName, description, marketplaceName }) => {
  const snippet = description ? description.substring(0, SEO_DESCRIPTION_SNIPPET_CHARS) : '';
  return intl
    .formatMessage(
      { id: brandName ? 'ListingPage.seoDescriptionWithBrand' : 'ListingPage.seoDescriptionNoBrand' },
      { title, brand: brandName, marketplaceName, description: snippet }
    )
    .trim()
    .substring(0, SEO_DESCRIPTION_MAX_CHARS);
};

/**
 * Canonical product URL for structured data: the path only, never the query string or hash,
 * so UTM parameters cannot leak into JSON-LD.
 */
export const getCanonicalProductUrl = (marketplaceRootURL, pathname) =>
  `${marketplaceRootURL}${pathname}`;

/**
 * Browser tab and search result title for a listing.
 * The product name leads, so a truncated mobile title still says what the page is. Listing
 * titles often already carry the brand name; it is only added when missing, so the title never
 * reads "Nicobar by Nicobar".
 *
 * @param {Object} intl react-intl instance
 * @param {Object} args
 * @param {string} args.title listing title
 * @param {string?} args.brandName
 * @param {string} args.marketplaceName
 * @returns {string}
 */
export const getListingSchemaTitle = (intl, { title, brandName, marketplaceName }) => {
  const brandAlreadyInTitle =
    !!brandName && String(title).toLowerCase().includes(brandName.toLowerCase());
  const id =
    brandName && !brandAlreadyInTitle
      ? 'ListingPage.schemaTitleWithBrand'
      : 'ListingPage.schemaTitleNoBrand';
  return intl.formatMessage({ id }, { title, brand: brandName, marketplaceName });
};
