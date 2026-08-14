/**
 * savedRecommendations.js
 *
 * Fires the `saved_recommendation_click` dataLayer event for the /saved page's
 * inspiration-first recommendations rail (add-to-cart-restoration-prd.md §14,
 * insights/crossshop-tracking-prd.md §14). Same minimal window.dataLayer.push
 * pattern as brandClickout.js / homepageEditorial.js — model on pushNewFromIndiaClick,
 * with mela_session_id added so recs clicks can be joined to the same session as any
 * brand_clickout from the same visit.
 */

import { getOrCreateSessionId } from '../sentimentCapture';

export const pushSavedRecommendationClick = (brandId, productId) => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'saved_recommendation_click',
    brand_id: brandId || null,
    product_id: productId || null,
    mela_session_id: getOrCreateSessionId(),
  });
};
