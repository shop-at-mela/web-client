/**
 * homepageEditorial.js
 *
 * Fires the 5 dataLayer events for the P1.3 homepage editorial modules
 * (storefront-validation-readiness-prd.md P1.3a "Measurement (extends P0.6)").
 * Same direct dataLayer.push pattern as brandClickout.js / vettingStrip.js.
 */

const push = (event, params = {}) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

export const pushSpotlightView = brandId => push('spotlight_view', { brand_id: brandId || null });

export const pushSpotlightBrandClick = brandId =>
  push('spotlight_brand_click', { brand_id: brandId || null });

export const pushSpotlightStoreClick = brandId =>
  push('spotlight_store_click', { brand_id: brandId || null });

export const pushNewFromIndiaClick = (brandId, productId) =>
  push('new_from_india_click', { brand_id: brandId || null, product_id: productId || null });

export const pushCraftTileClick = brandId => push('craft_tile_click', { brand_id: brandId || null });
