import { storableError } from '../util/errors';

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

export const fetchCategoryProducts = (categoryLevel, categoryName, config) => (dispatch, getState, sdk) => {
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
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.listing-card', 'variants.listing-card-2x'],
    'limit': 8, // Limit to 8 products for carousel
    [`pub_${categoryLevel}`]: categoryName,
  };

  return sdk.listings
    .query(queryParams)
    .then(response => {
      const entities = response.data;
      const listingEntities = entities.data;

      dispatch(fetchCategoryProductsSuccess(categoryKey, listingEntities));
      return response;
    })
    .catch(e => {
      const error = storableError(e);
      console.error('CategoryProducts: API error for', categoryKey, e);
      dispatch(fetchCategoryProductsError(categoryKey, error));
      return { error };
    });
};