// TODO: remove after hero brand carousel ships (HeroSection now uses BrandsPage duck)
import { storableError } from '../util/errors';
import { pickRandom } from '../util/data';

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

// Helper to attach images from included data onto listing objects
const attachImagesToListings = (listings, includedData) => {
  const imageMap = {};
  (includedData || []).forEach(item => {
    if (item.type === 'image') {
      imageMap[item.id.uuid] = item;
    }
  });
  return listings.map(listing => {
    const imageRelationships = listing.relationships?.images?.data || [];
    const images = imageRelationships.map(rel => imageMap[rel.id.uuid]).filter(Boolean);
    return { ...listing, attributes: { ...listing.attributes, images } };
  });
};


export const fetchHeroProducts = (config) => (dispatch, getState, sdk) => {
  dispatch(fetchHeroProductsRequest());

  const baseParams = {
    include: ['author', 'images'],
    'fields.listing': ['title', 'geolocation', 'price', 'publicData.brand', 'publicData.sku'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.listing-card', 'variants.listing-card-2x'],
    'imageVariant.listing-card': 'w:400;h:300;fit:crop',
    'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop',
  };

  // Fetch cascade: homepageFeature → bestsellers → newest
  const tryQuery = (params) =>
    sdk.listings.query(params).then(res => {
      const { data, included } = res.data;
      return attachImagesToListings(data, included);
    });

  return tryQuery({ ...baseParams, perPage: 10, pub_homepageFeature: true })
    .then(featured => {
      if (featured.length >= 3) {
        return pickRandom(featured, 3);
      }
      // Fallback 1: bestsellers
      return tryQuery({ ...baseParams, perPage: 25, pub_isBestseller: true })
        .then(bestsellers => {
          if (bestsellers.length >= 3) {
            return pickRandom(bestsellers, 3);
          }
          // Fallback 2: newest
          return tryQuery({ ...baseParams, perPage: 25, sort: 'createdAt' })
            .then(newest => pickRandom(newest, 3));
        });
    })
    .then(products => {
      dispatch(fetchHeroProductsSuccess(products));
    })
    .catch(e => {
      const error = storableError(e);
      console.error('HeroProducts: API error', e);
      dispatch(fetchHeroProductsError(error));
      return { error };
    });
};