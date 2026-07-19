/**
 * brandClickout.js
 *
 * Fires the `brand_clickout` dataLayer event used for the cross-shop /
 * entry-vs-exit mutualization analysis (see
 * mela-docs/product/prds/crossshop-tracking-prd.md and
 * web-client/docs/analytics/crossshop-tracking.md for the schema).
 *
 * All three "Shop from Brand" CTA surfaces (OrderPanel, ProductOrderForm,
 * InquiryWithoutPaymentForm) and RedirectTrustSheet's onContinue call
 * openBrandStorefront() instead of window.open() directly, so the event fires
 * exactly once, at the moment of actual redirect — not on button press, which
 * would double-count on trust-sheet dismissal.
 */

import { getEntrySource } from './entrySource';

/**
 * @param {object} params
 * @param {string} [params.brandName]  - publicData.brand
 * @param {string} [params.brandId]    - listing author (brand user) UUID — see PRD §5b
 * @param {string} [params.category]   - publicData.categoryLevel3 || categoryLevel2 || categoryLevel1
 * @param {string} [params.productId]  - listing.id.uuid
 * @param {string} [params.destination] - the outbound Shopify URL
 */
export const pushBrandClickout = (params = {}) => {
  const { brandName, brandId, category, productId, destination } = params || {};
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'brand_clickout',
    brand_name: brandName || null,
    brand_id: brandId || null,
    category: category || null,
    product_id: productId || null,
    entry_source: getEntrySource(),
    destination: destination || null,
  });
};

/**
 * Fires brand_clickout, then opens the brand's Shopify store in a new tab.
 * Note: window.open(url, '_blank', ...) does not unload the Mela tab, so the
 * dataLayer push is not at risk of being killed mid-flight the way a same-tab
 * navigation would be — see PRD §5c. Still pushed before window.open as
 * defensive ordering.
 *
 * @param {string} url - destination Shopify URL
 * @param {object} trackingParams - see pushBrandClickout params (destination is set from `url`)
 */
export const openBrandStorefront = (url, trackingParams = {}) => {
  pushBrandClickout({ ...trackingParams, destination: url });
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
