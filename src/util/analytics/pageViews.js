/**
 * pageViews.js
 *
 * Fires the `listing_view` and `brand_page_view` dataLayer events so the Basics
 * dashboard can count product and brand views directly instead of inferring them from
 * generic page_view paths (mela-docs/product/prds/insights/basic-dashboards-prd.md §4.1).
 *
 * Same direct window.dataLayer.push pattern as brandClickout.js, with the same field
 * sourcing (author UUID as brand_id, most specific category level) so these events join
 * cleanly to brand_clickout on product and brand. Missing fields are pushed as explicit
 * null, never omitted.
 *
 * The useXxxView hooks fire once per distinct id, so re-renders and data refetches of the
 * same page do not double count. Navigating to a different listing/brand fires again.
 */

import { useEffect, useRef } from 'react';
import { getOrCreateSessionId } from '../sentimentCapture';
import { getDutiesTypeForAnalytics } from '../brandShipping';

export const pushListingView = ({ listingId, brandId, brandName, category, dutiesType } = {}) => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'listing_view',
    listing_id: listingId || null,
    brand_id: brandId || null,
    brand_name: brandName || null,
    category: category || null,
    duties_type: dutiesType || null,
    mela_session_id: getOrCreateSessionId(),
  });
};

export const pushBrandPageView = ({ brandId, brandName } = {}) => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'brand_page_view',
    brand_id: brandId || null,
    brand_name: brandName || null,
    mela_session_id: getOrCreateSessionId(),
  });
};

/**
 * Fires listing_view once per listing id, after the listing has loaded.
 * @param {object} listing - Sharetribe listing entity (may still be loading / empty)
 */
export const useListingView = listing => {
  const firedFor = useRef(null);
  const listingId = listing?.id?.uuid;

  useEffect(() => {
    if (!listingId || firedFor.current === listingId) return;
    firedFor.current = listingId;
    const publicData = listing?.attributes?.publicData || {};
    pushListingView({
      listingId,
      brandId: listing?.author?.id?.uuid,
      brandName: publicData.brand,
      category: publicData.categoryLevel3 || publicData.categoryLevel2 || publicData.categoryLevel1,
      dutiesType: getDutiesTypeForAnalytics(listing?.author),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);
};

/**
 * Fires brand_page_view once per brand user id, after the brand user has loaded.
 * @param {object} user - Sharetribe user entity (may be undefined while loading)
 */
export const useBrandPageView = user => {
  const firedFor = useRef(null);
  const brandId = user?.id?.uuid;

  useEffect(() => {
    if (!brandId || firedFor.current === brandId) return;
    firedFor.current = brandId;
    pushBrandPageView({ brandId, brandName: user?.attributes?.profile?.displayName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);
};
