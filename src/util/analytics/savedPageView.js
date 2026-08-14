/**
 * savedPageView.js
 *
 * Fires the `saved_page_view` dataLayer event so the Add-to-Cart-confirmation and
 * header-badge entry points into /saved can be connected to what happens once the
 * shopper actually lands there (and, downstream, to `brand_clickout`) — see
 * mela-docs/product/prds/add-to-cart-restoration-prd.md §12.3.
 *
 * Follows the same direct dataLayer.push pattern as brandClickout.js / savedListings.js —
 * no shared event bus exists yet for this class of event.
 */

export const SAVED_PAGE_ENTRY_PARAM = 'entry';

/**
 * @param {object} params
 * @param {'add_to_cart_confirmation'|'header_badge'|'direct'} params.entry - which UI
 *   surface sent the shopper to /saved
 * @param {boolean} [params.recsShown] - whether SavedPageRecommendations rendered a
 *   non-empty rail on this visit (§14, insights/crossshop-tracking-prd.md §14)
 * @param {number} [params.brandGroupCount] - number of SavedBrandGroup sections rendered
 *   (0 for an empty cart)
 */
export const pushSavedPageView = (params = {}) => {
  const { entry, recsShown, brandGroupCount } = params || {};
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'saved_page_view',
    entry: entry || 'direct',
    recs_shown: !!recsShown,
    brand_group_count: typeof brandGroupCount === 'number' ? brandGroupCount : 0,
  });
};
