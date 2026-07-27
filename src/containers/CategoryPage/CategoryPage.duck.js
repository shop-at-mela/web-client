import { loadData as searchPageLoadData } from '../SearchPage/SearchPage.duck';
import { stringify } from '../../util/urlHelpers';
import {
  addMarketplaceEntities,
  getMarketplaceEntities,
  getListingsById,
} from '../../ducks/marketplaceData.duck';

// ================ P1.2: brand-tile module ================ //
// Interleaved BrandCardHome tiles (storefront-validation-readiness-prd.md P1.2) need a
// full brand profile (logo, tagline, certifications) — richer than the sparse
// `profile.displayName`-only author fields SearchPage's shared query requests (see
// SearchPage.duck.js `fields.user`). Rather than widen that shared query (used by every
// search on the site) or run a second listings query, this fetches just the handful of
// distinct brand profiles already represented on the current category page, mirroring
// BrandsPage.duck.js's `fetchFeaturedBrands` per-brand `sdk.users.show` call (scoped
// down: no bestseller fetch — the tile reuses listings already loaded on the page).

const CATEGORY_BRAND_TILES_REQUEST = 'app/CategoryPage/CATEGORY_BRAND_TILES_REQUEST';
const CATEGORY_BRAND_TILES_SUCCESS = 'app/CategoryPage/CATEGORY_BRAND_TILES_SUCCESS';

export const MAX_CATEGORY_BRAND_TILES = 3;

const initialState = {
  brandTileIds: [],
  brandTilesInProgress: false,
};

export const categoryPageReducer = (state = initialState, action) => {
  switch (action.type) {
    case CATEGORY_BRAND_TILES_REQUEST:
      return { ...state, brandTilesInProgress: true };
    case CATEGORY_BRAND_TILES_SUCCESS:
      return { ...state, brandTilesInProgress: false, brandTileIds: action.payload };
    default:
      return state;
  }
};

/**
 * Fetch full profiles for up to MAX_CATEGORY_BRAND_TILES distinct brand ids.
 * @param {Array<string>} brandIds - distinct brand user UUIDs from the current page's listings
 */
export const fetchCategoryBrandTiles = brandIds => (dispatch, getState, sdk) => {
  const candidateIds = (brandIds || []).slice(0, MAX_CATEGORY_BRAND_TILES);

  dispatch({ type: CATEGORY_BRAND_TILES_REQUEST });

  if (candidateIds.length === 0) {
    dispatch({ type: CATEGORY_BRAND_TILES_SUCCESS, payload: [] });
    return Promise.resolve();
  }

  return Promise.all(
    candidateIds.map(id =>
      sdk.users
        .show({
          id,
          include: ['profileImage'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
          'fields.user': ['profile', 'metadata'],
        })
        .then(response => response?.data || null)
        .catch(() => null)
    )
  ).then(responses => {
    const valid = responses.filter(Boolean);
    const merged = valid.reduce(
      (acc, { data, included = [] }) => ({
        data: [...acc.data, data],
        included: [...acc.included, ...included],
      }),
      { data: [], included: [] }
    );

    if (merged.data.length > 0) {
      dispatch(addMarketplaceEntities({ data: merged }));
    }

    dispatch({
      type: CATEGORY_BRAND_TILES_SUCCESS,
      payload: merged.data.map(user => user.id.uuid),
    });
  });
};

/**
 * Denormalised brand user entities for the fetched tile ids, in fetch order.
 */
export const getCategoryBrandTiles = state => {
  const ids = state.CategoryPage?.brandTileIds || [];
  if (ids.length === 0) return [];
  const entityRefs = ids.map(id => ({ id: { uuid: id }, type: 'user' }));
  return getMarketplaceEntities(state, entityRefs);
};

export default categoryPageReducer;

/**
 * Convert level1/level2/level3 path params into the pub_categoryLevelN
 * query params that SearchPage.duck.loadData expects.
 */
const categoryParamsToSearch = (params, existingSearch) => {
  const categoryQueryParams = {};
  if (params.level1) categoryQueryParams.pub_categoryLevel1 = params.level1;
  if (params.level2) categoryQueryParams.pub_categoryLevel2 = params.level2;
  if (params.level3) categoryQueryParams.pub_categoryLevel3 = params.level3;

  const existingQuery = existingSearch?.replace(/^\?/, '') || '';
  const categoryQuery = stringify(categoryQueryParams);
  const mergedSearch = [existingQuery, categoryQuery].filter(Boolean).join('&');
  return mergedSearch ? `?${mergedSearch}` : '';
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const mergedSearch = categoryParamsToSearch(params, search);
  const searchThunk = searchPageLoadData(params, mergedSearch, config);

  return searchThunk(dispatch, getState, sdk).then(result => {
    const { currentPageResultIds = [] } = getState().SearchPage || {};
    const listings = getListingsById(getState(), currentPageResultIds);

    const seen = new Set();
    const brandIds = [];
    listings.forEach(listing => {
      const authorId = listing.author?.id?.uuid;
      if (authorId && !seen.has(authorId)) {
        seen.add(authorId);
        brandIds.push(authorId);
      }
    });

    return dispatch(fetchCategoryBrandTiles(brandIds)).then(() => result);
  });
};
