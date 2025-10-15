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
    'imageVariant.listing-card': 'w:400;h:300;fit:crop', // Define listing-card variant
    'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop', // Define listing-card-2x variant
    perPage: 6, // Limit to 6 products for optimal UX and performance
    [`pub_${categoryLevel}`]: categoryName,
  };

  return sdk.listings
    .query(queryParams)
    .then(response => {
      const { data, included } = response.data;

      // Helper function to attach images to listings from included data
      const attachImagesToListings = (listings, includedData) => {
        const imageMap = {};

        // Create a map of image IDs to image objects
        (includedData || []).forEach(item => {
          if (item.type === 'image') {
            imageMap[item.id.uuid] = item;
          }
        });

        // Attach images to each listing
        return listings.map(listing => {
          const imageRelationships = listing.relationships?.images?.data || [];
          const images = imageRelationships.map(rel => imageMap[rel.id.uuid]).filter(Boolean);

          return {
            ...listing,
            attributes: {
              ...listing.attributes,
              images: images // Images with their original attributes structure
            }
          };
        });
      };

      // Process listings to include image data
      const listingsWithImages = attachImagesToListings(data, included);

      dispatch(fetchCategoryProductsSuccess(categoryKey, listingsWithImages));
      return response;
    })
    .catch(e => {
      const error = storableError(e);
      console.error('CategoryProducts: API error for', categoryKey, e);
      dispatch(fetchCategoryProductsError(categoryKey, error));
      return { error };
    });
};