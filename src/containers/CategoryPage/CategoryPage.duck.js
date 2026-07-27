import { loadData as searchPageLoadData } from '../SearchPage/SearchPage.duck';
import { stringify } from '../../util/urlHelpers';
import {
  addMarketplaceEntities,
  getMarketplaceEntities,
  getListingsById,
} from '../../ducks/marketplaceData.duck';
import { getBrandIdsByCategory } from '../../config/configBrands';

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

// ================ "Shop {L1} Brands" carousel ================ //
// A BrandCarousel of every brand configured under the current page's L1 category
// (config/configBrands.js's static category field — cheap, no query needed to find
// the roster), placed right after the occasion strip. The roster is always the full
// L1 brand list regardless of how deep the current page is (an L2/L3 page like
// Fashion > Women's Ethnic still shows every Fashion brand), but each brand's product
// row is scoped to the current page's deepest category level — a brand with zero
// listings at that level is dropped from the carousel entirely (not shown empty).

const CATEGORY_BRAND_CAROUSEL_REQUEST = 'app/CategoryPage/CATEGORY_BRAND_CAROUSEL_REQUEST';
const CATEGORY_BRAND_CAROUSEL_SUCCESS = 'app/CategoryPage/CATEGORY_BRAND_CAROUSEL_SUCCESS';

export const MAX_CATEGORY_CAROUSEL_PRODUCTS = 4;

// L1 route param values (Sharetribe Console category config ids, also used as
// CATEGORY_DESCRIPTIONS keys in CategoryPage.js) mapped to the BRAND_CATEGORIES id
// configBrands.js tags each brand with. Categories with no mapping (e.g.
// Food-Gourmet, Art-Craft) simply have no brands configured yet — carousel omitted.
const LEVEL1_TO_BRAND_CATEGORY = {
  'Baby-Kids': 'baby_and_kids',
  Fashion: 'fashion',
  'Home-Kitchen': 'home_and_kitchen',
  'Beauty-Wellness': 'beauty_and_wellness',
  'Jewelry-Accessories': 'jewelry_and_accessories',
};

const initialState = {
  brandTileIds: [],
  brandTilesInProgress: false,
  brandCarouselEntries: [],
  brandCarouselInProgress: false,
};

export const categoryPageReducer = (state = initialState, action) => {
  switch (action.type) {
    case CATEGORY_BRAND_TILES_REQUEST:
      return { ...state, brandTilesInProgress: true };
    case CATEGORY_BRAND_TILES_SUCCESS:
      return { ...state, brandTilesInProgress: false, brandTileIds: action.payload };
    case CATEGORY_BRAND_CAROUSEL_REQUEST:
      return { ...state, brandCarouselInProgress: true };
    case CATEGORY_BRAND_CAROUSEL_SUCCESS:
      return { ...state, brandCarouselInProgress: false, brandCarouselEntries: action.payload };
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

/**
 * Fetch the "Shop {L1} Brands" carousel: every brand configured under params.level1's
 * BRAND_CATEGORIES mapping, each with its listings scoped to the deepest category level
 * present (level3 > level2 > level1). Brands with zero matching listings are dropped —
 * a brand tile with an empty product grid is worse than not showing the brand at all.
 */
export const fetchCategoryBrandCarousel = params => (dispatch, getState, sdk) => {
  const brandCategory = LEVEL1_TO_BRAND_CATEGORY[params?.level1];
  const brandIds = getBrandIdsByCategory(brandCategory);

  dispatch({ type: CATEGORY_BRAND_CAROUSEL_REQUEST });

  if (brandIds.length === 0) {
    dispatch({ type: CATEGORY_BRAND_CAROUSEL_SUCCESS, payload: [] });
    return Promise.resolve();
  }

  const listingCategoryParams = { pub_categoryLevel1: params.level1 };
  if (params.level2) listingCategoryParams.pub_categoryLevel2 = params.level2;
  if (params.level3) listingCategoryParams.pub_categoryLevel3 = params.level3;

  return Promise.all(
    brandIds.map(brandId =>
      sdk.listings
        .query({
          author_id: brandId,
          ...listingCategoryParams,
          perPage: MAX_CATEGORY_CAROUSEL_PRODUCTS,
          include: ['images'],
          'fields.listing': ['title', 'price', 'publicData'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
        })
        .then(response => ({
          brandId,
          data: response?.data?.data || [],
          included: response?.data?.included || [],
        }))
        .catch(() => ({ brandId, data: [], included: [] }))
    )
  ).then(listingResults => {
    // A brand with no listings at the current category depth doesn't get a tile.
    const withListings = listingResults.filter(r => r.data.length > 0);

    if (withListings.length === 0) {
      dispatch({ type: CATEGORY_BRAND_CAROUSEL_SUCCESS, payload: [] });
      return;
    }

    const listingEntities = withListings.flatMap(r => r.data);
    const listingIncluded = withListings.flatMap(r => r.included);
    dispatch(addMarketplaceEntities({ data: { data: listingEntities, included: listingIncluded } }));

    return Promise.all(
      withListings.map(({ brandId }) =>
        sdk.users
          .show({
            id: brandId,
            include: ['profileImage'],
            'fields.image': ['variants.square-small', 'variants.square-small2x'],
            'fields.user': ['profile', 'metadata'],
          })
          .then(response => response?.data || null)
          .catch(() => null)
      )
    ).then(userResponses => {
      const validUsers = userResponses.filter(Boolean);
      const userEntities = validUsers.map(r => r.data);
      const userIncluded = validUsers.flatMap(r => r.included || []);

      if (userEntities.length > 0) {
        dispatch(addMarketplaceEntities({ data: { data: userEntities, included: userIncluded } }));
      }

      const fetchedBrandIds = new Set(userEntities.map(user => user.id.uuid));
      const entries = withListings
        .filter(r => fetchedBrandIds.has(r.brandId))
        .map(r => ({ brandId: r.brandId, productIds: r.data.map(l => l.id.uuid) }));

      dispatch({ type: CATEGORY_BRAND_CAROUSEL_SUCCESS, payload: entries });
    });
  });
};

/**
 * { brand, products } entries for the "Shop {L1} Brands" carousel, in roster order —
 * the same shape FeaturedBrandPartners/BrandCarousel already expect.
 */
export const getCategoryBrandCarousel = state => {
  const entries = state.CategoryPage?.brandCarouselEntries || [];
  if (entries.length === 0) return [];

  const brandRefs = entries.map(e => ({ id: { uuid: e.brandId }, type: 'user' }));
  const brands = getMarketplaceEntities(state, brandRefs);
  const brandById = {};
  brands.forEach(brand => {
    brandById[brand.id.uuid] = brand;
  });

  return entries
    .map(entry => {
      const brand = brandById[entry.brandId];
      if (!brand) return null;
      const productRefs = entry.productIds.map(id => ({ id: { uuid: id }, type: 'listing' }));
      const products = getMarketplaceEntities(state, productRefs);
      return { brand, products };
    })
    .filter(Boolean);
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

    return Promise.all([
      dispatch(fetchCategoryBrandTiles(brandIds)),
      dispatch(fetchCategoryBrandCarousel(params)),
    ]).then(() => result);
  });
};
