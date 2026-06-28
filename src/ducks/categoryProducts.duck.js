import { storableError } from '../util/errors';
import { pickRandom, attachImagesToListings } from '../util/listings';
import { fetchBestsellerCarousel } from '../util/bestsellerCarousel';

// ================ Action types ================ //

export const FETCH_CATEGORY_PRODUCTS_REQUEST = 'app/categoryProducts/FETCH_CATEGORY_PRODUCTS_REQUEST';
export const FETCH_CATEGORY_PRODUCTS_SUCCESS = 'app/categoryProducts/FETCH_CATEGORY_PRODUCTS_SUCCESS';
export const FETCH_CATEGORY_PRODUCTS_ERROR = 'app/categoryProducts/FETCH_CATEGORY_PRODUCTS_ERROR';

// ================ Reducer ================ //

const initialState = {
  categoryProductsById: {},
  fetchCategoryProductsInProgress: {},
  fetchCategoryProductsError: {},
};

export default function categoryProductsReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_CATEGORY_PRODUCTS_REQUEST: {
      const { categoryKey } = payload;
      return {
        ...state,
        fetchCategoryProductsInProgress: {
          ...state.fetchCategoryProductsInProgress,
          [categoryKey]: true,
        },
        fetchCategoryProductsError: {
          ...state.fetchCategoryProductsError,
          [categoryKey]: null,
        },
      };
    }
    case FETCH_CATEGORY_PRODUCTS_SUCCESS: {
      const { categoryKey, data } = payload;
      return {
        ...state,
        categoryProductsById: {
          ...state.categoryProductsById,
          [categoryKey]: data,
        },
        fetchCategoryProductsInProgress: {
          ...state.fetchCategoryProductsInProgress,
          [categoryKey]: false,
        },
      };
    }
    case FETCH_CATEGORY_PRODUCTS_ERROR: {
      const { categoryKey, error } = payload;
      return {
        ...state,
        fetchCategoryProductsInProgress: {
          ...state.fetchCategoryProductsInProgress,
          [categoryKey]: false,
        },
        fetchCategoryProductsError: {
          ...state.fetchCategoryProductsError,
          [categoryKey]: error,
        },
      };
    }
    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchCategoryProductsRequest = categoryKey => ({
  type: FETCH_CATEGORY_PRODUCTS_REQUEST,
  payload: { categoryKey },
});

export const fetchCategoryProductsSuccess = (categoryKey, data) => ({
  type: FETCH_CATEGORY_PRODUCTS_SUCCESS,
  payload: { categoryKey, data },
});

export const fetchCategoryProductsError = (categoryKey, error) => ({
  type: FETCH_CATEGORY_PRODUCTS_ERROR,
  payload: { categoryKey, error },
  error: true,
});

// ================ Thunks ================ //

const DISPLAY_COUNT = 9; // Limit to 9 products for optimal UX and performance

export const fetchCategoryProducts = (categoryLevel, categoryName, config, excludeListingId = null) => (dispatch, getState, sdk) => {
  const categoryKey = `${categoryLevel}:${categoryName}`;

  dispatch(fetchCategoryProductsRequest(categoryKey));

  const queryParams = {
    include: ['author', 'images'],
    'fields.listing': [
      'title',
      'geolocation',
      'price',
      'publicData.brand',
      'publicData.sku',
      'publicData.certification',
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.listing-card', 'variants.listing-card-2x'],
    'imageVariant.listing-card': 'w:400;h:300;fit:crop',
    'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop',
    [`pub_${categoryLevel}`]: categoryName,
  };

  return fetchBestsellerCarousel(sdk, queryParams, DISPLAY_COUNT)
    .then(({ pool, allIncluded }) => {
      // Attach images and randomize
      const listingsWithImages = attachImagesToListings(pool, allIncluded);
      let finalListings = pickRandom(listingsWithImages, DISPLAY_COUNT);

      // Filter out the current listing if excludeListingId is provided
      if (excludeListingId) {
        finalListings = finalListings.filter(listing => listing.id.uuid !== excludeListingId);
      }

      dispatch(fetchCategoryProductsSuccess(categoryKey, finalListings));
    })
    .catch(e => {
      const error = storableError(e);
      console.error('CategoryProducts: API error for', categoryKey, e);
      dispatch(fetchCategoryProductsError(categoryKey, error));
      return { error };
    });
};