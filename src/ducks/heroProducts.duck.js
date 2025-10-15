import { storableError } from '../util/errors';

// ================ Action types ================ //

export const FETCH_HERO_PRODUCTS_REQUEST = 'app/heroProducts/FETCH_HERO_PRODUCTS_REQUEST';
export const FETCH_HERO_PRODUCTS_SUCCESS = 'app/heroProducts/FETCH_HERO_PRODUCTS_SUCCESS';
export const FETCH_HERO_PRODUCTS_ERROR = 'app/heroProducts/FETCH_HERO_PRODUCTS_ERROR';

// ================ Reducer ================ //

const initialState = {
  heroProducts: [],
  fetchHeroProductsInProgress: false,
  fetchHeroProductsError: null,
};

export default function heroProductsReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_HERO_PRODUCTS_REQUEST:
      return {
        ...state,
        fetchHeroProductsInProgress: true,
        fetchHeroProductsError: null,
      };
    case FETCH_HERO_PRODUCTS_SUCCESS:
      return {
        ...state,
        heroProducts: payload.data,
        fetchHeroProductsInProgress: false,
      };
    case FETCH_HERO_PRODUCTS_ERROR:
      return {
        ...state,
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: payload.error,
      };
    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchHeroProductsRequest = () => ({
  type: FETCH_HERO_PRODUCTS_REQUEST,
});

export const fetchHeroProductsSuccess = data => ({
  type: FETCH_HERO_PRODUCTS_SUCCESS,
  payload: { data },
});

export const fetchHeroProductsError = error => ({
  type: FETCH_HERO_PRODUCTS_ERROR,
  payload: { error },
  error: true,
});

// ================ Thunks ================ //

export const fetchHeroProducts = (config) => (dispatch, getState, sdk) => {
  dispatch(fetchHeroProductsRequest());

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
    'imageVariant.listing-card': 'w:400;h:300;fit:crop',
    'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop',
    perPage: 25, // Fetch more products to randomize selection
    sort: 'createdAt', // Get newest products
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
              images: images
            }
          };
        });
      };

      // Process listings to include image data
      const listingsWithImages = attachImagesToListings(data, included);

      // Randomly select 3 products from the fetched results
      const randomProducts = [];
      if (listingsWithImages.length > 0) {
        const availableProducts = [...listingsWithImages];
        const numToSelect = Math.min(3, availableProducts.length);

        for (let i = 0; i < numToSelect; i++) {
          const randomIndex = Math.floor(Math.random() * availableProducts.length);
          randomProducts.push(availableProducts[randomIndex]);
          // Remove selected product to avoid duplicates
          availableProducts.splice(randomIndex, 1);
        }
      }

      dispatch(fetchHeroProductsSuccess(randomProducts));
      return response;
    })
    .catch(e => {
      const error = storableError(e);
      console.error('HeroProducts: API error', e);
      dispatch(fetchHeroProductsError(error));
      return { error };
    });
};