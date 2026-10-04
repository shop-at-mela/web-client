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

  const saveSource = source || 'heart_icon';

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'saved_listing_toggle',
    save_source: saveSource,
    // Legacy key, still read by GTM `DLV - source` (GTM Version 9 sends it to GA4 as
    // `save_source`). A GA4 event parameter literally named `source` is read as traffic
    // source, so this key must never be mapped to a GA4 `source` parameter. Remove it once
    // GTM `DLV - source` is repointed to `save_source`.
    source: saveSource,
    listing_id: listingId || null,
    is_saved: !!isSaved,
  });
};
