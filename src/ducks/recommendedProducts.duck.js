import { storableError } from '../util/errors';
import { addMarketplaceEntities } from './marketplaceData.duck';

// ================ Action types ================ //

export const FETCH_RECOMMENDED_PRODUCTS_REQUEST = 'app/RecommendedProducts/FETCH_RECOMMENDED_PRODUCTS_REQUEST';
export const FETCH_RECOMMENDED_PRODUCTS_SUCCESS = 'app/RecommendedProducts/FETCH_RECOMMENDED_PRODUCTS_SUCCESS';
export const FETCH_RECOMMENDED_PRODUCTS_ERROR = 'app/RecommendedProducts/FETCH_RECOMMENDED_PRODUCTS_ERROR';

// ================ Reducer ================ //

const initialState = {
  recommendedProductIds: null,
  fetchRecommendedProductsInProgress: false,
  fetchRecommendedProductsError: null,
};

export default function RecommendedProductsReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_RECOMMENDED_PRODUCTS_REQUEST:
      return {
        ...state,
        fetchRecommendedProductsInProgress: true,
        fetchRecommendedProductsError: null,
      };

    case FETCH_RECOMMENDED_PRODUCTS_SUCCESS:
      return {
        ...state,
        recommendedProductIds: payload.productIds,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      };

    case FETCH_RECOMMENDED_PRODUCTS_ERROR:
      return {
        ...state,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchRecommendedProductsRequest = () => ({
  type: FETCH_RECOMMENDED_PRODUCTS_REQUEST,
});

export const fetchRecommendedProductsSuccess = productIds => ({
  type: FETCH_RECOMMENDED_PRODUCTS_SUCCESS,
  payload: { productIds },
});

export const fetchRecommendedProductsError = error => ({
  type: FETCH_RECOMMENDED_PRODUCTS_ERROR,
  payload: error,
});

// ================ Thunks ================ //

/**
 * Fetch recommended products by their SKUs
 * @param {Array<string>} skus - Array of product SKUs to fetch
 */
export const fetchRecommendedProducts = skus => (dispatch, getState, sdk) => {
  if (!skus || skus.length === 0) {
    return Promise.resolve();
  }

  dispatch(fetchRecommendedProductsRequest());

  // Create a filter for SKU matching
  // We search for listings where publicData.sku matches any of the provided SKUs
  const skuQueries = skus.map(sku => `pub_sku:${sku}`).join(' OR ');

  const queryParams = {
    keywords: skuQueries,
    pub_listingType: 'product', // Assuming we only want product listings
    states: ['published'], // Only published listings
    include: ['images'], // Include images for the product cards
    'fields.listing': ['title', 'price', 'publicData', 'images'],
    perPage: skus.length, // Limit to the number of SKUs we're looking for
  };

  return sdk.listings
    .query(queryParams)
    .then(response => {
      const { data } = response.data;

      // Filter to only include products that match our SKUs exactly
      const matchingProducts = data.filter(listing => {
        const listingSku = listing.attributes.publicData?.sku;
        return listingSku && skus.includes(listingSku);
      });

      // Sort products to match the order of the input SKUs
      const sortedProducts = skus
        .map(sku => matchingProducts.find(product => product.attributes.publicData?.sku === sku))
        .filter(Boolean); // Remove any undefined entries

      const productIds = sortedProducts.map(product => product.id);

      // Add products to marketplace entities store
      const sanitizeConfig = { listingFields: [] }; // Add appropriate listing fields if needed
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      dispatch(fetchRecommendedProductsSuccess(productIds));

      return response;
    })
    .catch(e => {
      const error = storableError(e);
      dispatch(fetchRecommendedProductsError(error));
      throw error;
    });
};