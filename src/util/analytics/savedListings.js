/**
 * savedListings.js
 *
 * Fires the `saved_listing_toggle` dataLayer event used to separate
 * purchase-intent signal (Add to Cart) from casual wishlist signal (heart icon)
 * — see mela-docs/product/prds/add-to-cart-restoration-prd.md §7 and
 * mela-docs/technical/analytics/crossshop-tracking.md for the schema.
 *
 * Follows the same direct dataLayer.push pattern as brandClickout.js /
 * vettingStrip.js — no shared event bus exists yet for this class of event.
 */

/**
 * @param {object} params
 * @param {'add_to_cart_button'|'heart_icon'} params.source - which UI surface toggled the save
 * @param {string} params.listingId - listing UUID string
 * @param {boolean} params.isSaved - state after the toggle (true = saved, false = unsaved)
 */
export const pushSaveToggle = (params = {}) => {
  const { source, listingId, isSaved } = params || {};
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'saved_listing_toggle',
    source: source || 'heart_icon',
    listing_id: listingId || null,
    is_saved: !!isSaved,
  });
};
