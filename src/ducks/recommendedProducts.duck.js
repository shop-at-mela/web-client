import { storableError } from '../util/errors';

// ================ Action types ================ //

export const FETCH_RECOMMENDED_PRODUCTS_REQUEST = 'app/RecommendedProducts/FETCH_RECOMMENDED_PRODUCTS_REQUEST';
export const FETCH_RECOMMENDED_PRODUCTS_SUCCESS = 'app/RecommendedProducts/FETCH_RECOMMENDED_PRODUCTS_SUCCESS';
export const FETCH_RECOMMENDED_PRODUCTS_ERROR = 'app/RecommendedProducts/FETCH_RECOMMENDED_PRODUCTS_ERROR';

// ================ Reducer ================ //

const initialState = {
  recommendedProductIds: null,
  recommendedProducts: [],
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
        recommendedProducts: payload.products || [],
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

export const fetchRecommendedProductsSuccess = (productIds, products) => ({
  type: FETCH_RECOMMENDED_PRODUCTS_SUCCESS,
  payload: { productIds, products },
});

export const fetchRecommendedProductsError = error => ({
  type: FETCH_RECOMMENDED_PRODUCTS_ERROR,
  payload: error,
});

// ================ Thunks ================ //

/**
 * Fetch recommended products by their SKUs
 * @param {Array<string>} skus - Array of product SKUs to fetch
 * @param {Object} config - Marketplace configuration containing listing fields
 */
export const fetchRecommendedProducts = (skus, config) => (dispatch, getState, sdk) => {
  if (!skus || skus.length === 0) {
    return Promise.resolve();
  }

  dispatch(fetchRecommendedProductsRequest());

  // Create a filter for SKU matching using proper Sharetribe public data filtering
  const queryParams = {
    pub_sku: skus, // Search for listings where publicData.sku matches any of the provided SKUs
    states: ['published'], // Only published listings
    include: ['images'], // Include images for the product cards
    'fields.listing': ['title', 'price', 'publicData', 'images'],
    'fields.image': ['variants.listing-card', 'variants.listing-card-2x'], // Request specific image variants
    'imageVariant.listing-card': 'w:400;h:300;fit:crop', // Define listing-card variant
    'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop', // Define listing-card-2x variant
    perPage: 20, // Increase to get more results to filter from
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
            images: images, // Add images directly to listing object
            attributes: {
              ...listing.attributes,
              images: images // Also add to attributes for compatibility
            }
          };
        });
      };

      // Process listings to include image data
      const listingsWithImages = attachImagesToListings(data, included);

      // Filter to only include products that match our SKUs exactly
      const matchingProducts = listingsWithImages.filter(listing => {
        const listingSku = listing.attributes.publicData?.sku;
        return listingSku && skus.includes(listingSku);
      });

      // Sort products to match the order of the input SKUs
      const sortedProducts = skus
        .map(sku => matchingProducts.find(product => product.attributes.publicData?.sku === sku))
        .filter(Boolean); // Remove any undefined entries

      const productIds = sortedProducts.map(product => product.id);

      // Store products with images attached
      dispatch(fetchRecommendedProductsSuccess(productIds, sortedProducts));

      return response;
    })
    .catch(e => {
      const error = storableError(e);
      dispatch(fetchRecommendedProductsError(error));
      throw error;
    });
};