import { loadData as searchPageLoadData } from '../SearchPage/SearchPage.duck';
import { stringify } from '../../util/urlHelpers';

// Legacy occasion values already present on existing inventory (gifting-festival-traffic-prd.md
// Day 1 backfill hasn't run yet) — used as the default /gifts curation so the landing page
// isn't empty before the classifier backfill lands. Both are already-registered `occasion`
// search-schema values (confirmed live in dev), unlike gift_occasion/recipient.
const DEFAULT_GIFTING_OCCASIONS = ['gifting', 'diwali-festivals'];

/**
 * Builds the merged search string SearchPage.duck's loadData expects: the occasion filter
 * (a specific slug on /occasions/:slug, or the broad default set on /gifts) plus a
 * `giftingContext` flag. SearchPage.duck.js's sortSearchParams() reads that flag (and the
 * presence of pub_occasion/pub_gift_occasion generally) to default to a bestseller-aware
 * sort instead of createdAt — see SearchPage.duck.js.
 */
const giftingParamsToSearch = (occasionSlug, existingSearch) => {
  const occasionValues = occasionSlug ? [occasionSlug] : DEFAULT_GIFTING_OCCASIONS;
  const giftingQueryParams = {
    pub_occasion: `has_any:${occasionValues.join(',')}`,
    giftingContext: true,
  };

  const existingQuery = existingSearch?.replace(/^\?/, '') || '';
  const giftingQuery = stringify(giftingQueryParams);
  const mergedSearch = [existingQuery, giftingQuery].filter(Boolean).join('&');
  return mergedSearch ? `?${mergedSearch}` : '';
};

/**
 * No dedicated reducer — GiftingPage reuses state.SearchPage entirely (listings,
 * pagination, searchInProgress), so there's nothing here but the merged loadData.
 */
export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const mergedSearch = giftingParamsToSearch(params?.occasionSlug, search);
  const searchThunk = searchPageLoadData(params, mergedSearch, config);
  return searchThunk(dispatch, getState, sdk);
};
