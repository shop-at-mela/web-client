/**
 * occasionMosaic.js
 *
 * dataLayer events for the homepage "Shop by Occasion" mosaic (OccasionMosaic).
 * Tile order and photo are chosen per visit, so every event carries position, tile_count
 * and listing_id — without them a click-through rate can't be read per occasion.
 * Same direct dataLayer.push pattern as homepageEditorial.js.
 */

const push = (event, params = {}) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

const tileParams = (occasion, position, tileCount, listingId) => ({
  occasion,
  position,
  tile_count: tileCount,
  listing_id: listingId || null,
});

export const pushMosaicImpression = (occasion, position, tileCount, listingId) =>
  push('mosaic_impression', tileParams(occasion, position, tileCount, listingId));

export const pushMosaicTileClick = (occasion, position, tileCount, listingId) =>
  push('mosaic_tile_click', tileParams(occasion, position, tileCount, listingId));
