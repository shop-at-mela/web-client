import { storableError } from '../../util/errors';
import { pickRandom } from '../../util/listings';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  getRandomBrandIds,
  getPaginatedBrandIds,
  getFeaturedProductIds,
  getBrandConfiguration,
  getBrandCategory,
} from '../../config/configBrands';
import { denormalisedEntities } from '../../util/data';

// ================ Utility Functions ================ //

const fetchBestsellerListingsForBrand = (sdk, brandId) => {
  return sdk.listings
    .query({
      'fields.listing': ['title', 'price', 'publicData', 'images'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
      'imageVariant.square-small': 'w:400;h:300;fit:crop',
      'imageVariant.square-small2x': 'w:800;h:600;fit:crop',
      include: ['author', 'images'],
      author: brandId,
      pub_isBestseller: true,
      perPage: 20,
    })
    .then(response => {
      const { data = [], included = [] } = response.data || {};
      return { data, included };
    })
    .catch(error => {
      console.warn(`Failed to fetch bestseller listings for brand ${brandId}:`, error);
      return { data: [], included: [] };
    });
};

// ================ Action types ================ //

export const FETCH_BRANDS_REQUEST = 'app/BrandsPage/FETCH_BRANDS_REQUEST';
export const FETCH_BRANDS_SUCCESS = 'app/BrandsPage/FETCH_BRANDS_SUCCESS';
export const FETCH_BRANDS_ERROR = 'app/BrandsPage/FETCH_BRANDS_ERROR';

export const FETCH_FEATURED_BRANDS_REQUEST = 'app/BrandsPage/FETCH_FEATURED_BRANDS_REQUEST';
export const FETCH_FEATURED_BRANDS_SUCCESS = 'app/BrandsPage/FETCH_FEATURED_BRANDS_SUCCESS';
export const FETCH_FEATURED_BRANDS_ERROR = 'app/BrandsPage/FETCH_FEATURED_BRANDS_ERROR';

export const SET_BESTSELLER_PRODUCTS = 'app/BrandsPage/SET_BESTSELLER_PRODUCTS';

// ================ Reducer ================ //

const initialState = {
  brandIds: [],
  featuredBrandIds: [],
  pagination: null,
  fetchBrandsInProgress: false,
  fetchBrandsError: null,
  fetchFeaturedBrandsInProgress: false,
  fetchFeaturedBrandsError: null,
  bestsellerProductsByBrand: {}, // Map of brandId -> { data: [...], included: [...] }
};

export default function brandsPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_BRANDS_REQUEST:
      return {
        ...state,
        fetchBrandsInProgress: true,
        fetchBrandsError: null,
      };

    case FETCH_BRANDS_SUCCESS:
      // Append brand IDs on pagination, replace on first page
      const shouldAppend = payload.pagination.page > 1;
      return {
        ...state,
        brandIds: shouldAppend
          ? [...state.brandIds, ...payload.brandIds]
          : payload.brandIds,
        pagination: payload.pagination,
        fetchBrandsInProgress: false,
      };

    case FETCH_BRANDS_ERROR:
      return {
        ...state,
        fetchBrandsInProgress: false,
        fetchBrandsError: payload,
      };

    case FETCH_FEATURED_BRANDS_REQUEST:
      return {
        ...state,
        fetchFeaturedBrandsInProgress: true,
        fetchFeaturedBrandsError: null,
      };

    case FETCH_FEATURED_BRANDS_SUCCESS:
      return {
        ...state,
        featuredBrandIds: payload.brandIds,
        fetchFeaturedBrandsInProgress: false,
      };

    case FETCH_FEATURED_BRANDS_ERROR:
      return {
        ...state,
        fetchFeaturedBrandsInProgress: false,
        fetchFeaturedBrandsError: payload,
      };

    case SET_BESTSELLER_PRODUCTS:
      return {
        ...state,
        bestsellerProductsByBrand: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchBrandsRequest = () => ({
  type: FETCH_BRANDS_REQUEST,
});

export const fetchBrandsSuccess = (brandIds, pagination) => ({
  type: FETCH_BRANDS_SUCCESS,
  payload: { brandIds, pagination },
});

export const fetchBrandsError = error => ({
  type: FETCH_BRANDS_ERROR,
  payload: error,
  error: true,
});

export const fetchFeaturedBrandsRequest = () => ({
  type: FETCH_FEATURED_BRANDS_REQUEST,
});

export const fetchFeaturedBrandsSuccess = brandIds => ({
  type: FETCH_FEATURED_BRANDS_SUCCESS,
  payload: { brandIds },
});

export const fetchFeaturedBrandsError = error => ({
  type: FETCH_FEATURED_BRANDS_ERROR,
  payload: error,
  error: true,
});

export const setBestsellerProducts = bestsellersByBrand => ({
  type: SET_BESTSELLER_PRODUCTS,
  payload: bestsellersByBrand,
});

// ================ Thunks ================ //

/**
 * Fetch brand details from Marketplace API
 * Uses the user show endpoint for each brand ID
 * Also batch-fetches featured products for all brands in one query (performance optimization)
 */
export const fetchBrands = (params = {}) => (dispatch, getState, sdk) => {
  dispatch(fetchBrandsRequest());

  const { page = 1, perPage = 24 } = params;

  // Get brand IDs from config
  const { brandIds, totalPages, totalItems } = getPaginatedBrandIds(page, perPage);

  if (brandIds.length === 0) {
    // No brands to fetch
    dispatch(
      fetchBrandsSuccess([], {
        page,
        perPage,
        totalPages: 0,
        totalItems: 0,
      })
    );
    return Promise.resolve();
  }

  // Fetch all brands in parallel using Marketplace API
  const brandPromises = brandIds.map(brandId =>
    sdk.users
      .show({
        id: brandId,
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
        'fields.user': ['profile', 'metadata'],
      })
      .then(response => {
        // Ensure response and response.data exist
        if (response && response.data) {
          return response.data;
        }
        console.warn(`Invalid response for brand ${brandId}`);
        return null;
      })
      .catch(error => {
        // Log error but don't fail entire request
        console.error(`Failed to fetch brand ${brandId}:`, error);
        return null;
      })
  );

  // Fetch bestseller products for each brand in parallel
  const bestsellerPromises = brandIds.map(brandId =>
    fetchBestsellerListingsForBrand(sdk, brandId)
      .then(result => ({ brandId, ...result }))
  );

  // Batch fetch ALL featured products for these brands in ONE query (performance optimization)
  const allProductIds = getFeaturedProductIds(brandIds);
  const productsPromise =
    allProductIds.length > 0
      ? sdk.listings
          .query({
            ids: allProductIds,
            include: ['images'],
            'fields.listing': ['title', 'price', 'publicData'],
            'fields.image': ['variants.square-small', 'variants.square-small2x'],
            perPage: 100, // Fetch up to 100 products (4 per brand * 24 brands = 96 max)
          })
          .then(response => {
            if (response && response.data) {
              return response.data;
            }
            console.warn('Invalid response for products');
            return { data: [], included: [] };
          })
          .catch(error => {
            console.error('Failed to fetch featured products:', error);
            return { data: [], included: [] };
          })
      : Promise.resolve({ data: [], included: [] });

  // Wait for brands, bestsellers, and configured products to fetch in parallel
  return Promise.all([Promise.all(brandPromises), Promise.all(bestsellerPromises), productsPromise])
    .then(([brandResponses, bestsellerResponses, configProductsResponse]) => {
      // Filter out failed brand requests
      const validResponses = brandResponses.filter(r => r !== null);

      // Build bestseller products map by brand ID
      const bestsellersByBrand = {};
      (bestsellerResponses || []).forEach(({ brandId, data = [], included = [] }) => {
        if (data.length > 0) {
          // Randomize and select up to 4 bestseller products
          bestsellersByBrand[brandId] = {
            data: pickRandom(data, 4),
            included,
          };
        }
      });

      // Combine all responses and filter out any invalid user objects
      const users = validResponses
        .map(r => r?.data)
        .filter(user => {
          return (
            user &&
            typeof user === 'object' &&
            user.id &&
            user.id.uuid &&
            user.type === 'user' &&
            user.attributes
          );
        });

      // Filter included entities to ensure they're valid
      const included = validResponses
        .flatMap(r => r?.included || [])
        .filter(entity => {
          return (
            entity &&
            typeof entity === 'object' &&
            entity.id &&
            entity.id.uuid &&
            entity.type
          );
        });

      // Create clean copies of user objects without any problematic properties
      const validUsers = users
        .filter(u => u !== undefined && u !== null)
        .map(user => {
          // Build a clean user object from scratch
          const cleanUser = {
            id: user.id,
            type: user.type,
            attributes: user.attributes,
          };

          // Only include relationships if they exist and have valid (non-null) data
          if (user.relationships) {
            const cleanRelationships = {};
            Object.keys(user.relationships).forEach(key => {
              const rel = user.relationships[key];
              // Only include relationships where data is not null
              if (rel && rel.data && rel.data !== null) {
                cleanRelationships[key] = rel;
              }
            });
            // Only add relationships property if there are valid relationships
            if (Object.keys(cleanRelationships).length > 0) {
              cleanUser.relationships = cleanRelationships;
            }
          }

          return cleanUser;
        });

      const validIncluded = included.filter(e => e !== undefined && e !== null);

      // Process configured products response
      const configProducts = configProductsResponse.data || [];
      const configProductImages = configProductsResponse.included || [];

      // Filter valid configured products
      const validConfigProducts = configProducts.filter(
        listing =>
          listing &&
          typeof listing === 'object' &&
          listing.id &&
          listing.id.uuid &&
          listing.type === 'listing'
      );

      const validConfigProductImages = configProductImages.filter(
        entity =>
          entity &&
          typeof entity === 'object' &&
          entity.id &&
          entity.id.uuid &&
          entity.type === 'image'
      );

      // Process bestseller products and include them
      let bestsellerProducts = [];
      let bestsellerImages = [];
      Object.values(bestsellersByBrand).forEach(({ data = [], included = [] }) => {
        bestsellerProducts = bestsellerProducts.concat(
          data.filter(
            listing =>
              listing &&
              typeof listing === 'object' &&
              listing.id &&
              listing.id.uuid &&
              listing.type === 'listing'
          )
        );
        bestsellerImages = bestsellerImages.concat(
          included.filter(
            entity =>
              entity &&
              typeof entity === 'object' &&
              entity.id &&
              entity.id.uuid &&
              entity.type === 'image'
          )
        );
      });

      // Combine all entities (users + configured products + bestseller products + images)
      const allEntities = [...validUsers, ...validConfigProducts, ...bestsellerProducts];
      const allIncluded = [...validIncluded, ...validConfigProductImages, ...bestsellerImages];

      // Only dispatch if we have valid data
      if (allEntities.length > 0 || allIncluded.length > 0) {
        // Build entity payload
        const entityPayload = { data: allEntities };
        if (allIncluded.length > 0) {
          entityPayload.included = allIncluded;
        }

        // Wrap in sdkResponse format that addMarketplaceEntities expects
        dispatch(addMarketplaceEntities({ data: entityPayload }));
      }

      // Store brand IDs, bestseller products info, and pagination
      const successfulBrandIds = validUsers.map(user => user.id.uuid);
      dispatch(
        fetchBrandsSuccess(successfulBrandIds, {
          page,
          perPage,
          totalPages,
          totalItems,
        })
      );

      // Store bestseller products metadata for selector to use
      dispatch(setBestsellerProducts(bestsellersByBrand));

      return { data: validUsers };
    })
    .catch(e => {
      dispatch(fetchBrandsError(storableError(e)));
      throw e;
    });
};

/**
 * Fetch featured brand details
 */
export const fetchFeaturedBrands = () => (dispatch, getState, sdk) => {
  dispatch(fetchFeaturedBrandsRequest());

  const featuredIds = getRandomBrandIds(6);

  if (featuredIds.length === 0) {
    dispatch(fetchFeaturedBrandsSuccess([]));
    return Promise.resolve();
  }

  // Fetch all featured brands in parallel
  const brandPromises = featuredIds.map(brandId =>
    sdk.users
      .show({
        id: brandId,
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
        'fields.user': ['profile', 'metadata'],
      })
      .then(response => {
        // Ensure response and response.data exist
        if (response && response.data) {
          return response.data;
        }
        console.warn(`Invalid response for featured brand ${brandId}`);
        return null;
      })
      .catch(error => {
        console.error(`Failed to fetch featured brand ${brandId}:`, error);
        return null;
      })
  );

  // Fetch bestseller products for each featured brand in parallel
  const bestsellerPromises = featuredIds.map(brandId =>
    fetchBestsellerListingsForBrand(sdk, brandId)
      .then(result => ({ brandId, ...result }))
  );

  // Batch fetch ALL featured products for these brands in ONE query (performance optimization)
  const allProductIds = getFeaturedProductIds(featuredIds);
  const productsPromise =
    allProductIds.length > 0
      ? sdk.listings
          .query({
            ids: allProductIds,
            include: ['images'],
            'fields.listing': ['title', 'price', 'publicData'],
            'fields.image': ['variants.square-small', 'variants.square-small2x'],
            perPage: 100,
          })
          .then(response => {
            if (response && response.data) {
              return response.data;
            }
            console.warn('Invalid response for featured products');
            return { data: [], included: [] };
          })
          .catch(error => {
            console.error('Failed to fetch featured products:', error);
            return { data: [], included: [] };
          })
      : Promise.resolve({ data: [], included: [] });

  // Wait for brands, bestsellers, and configured products to fetch in parallel
  return Promise.all([Promise.all(brandPromises), Promise.all(bestsellerPromises), productsPromise])
    .then(([brandResponses, bestsellerResponses, configProductsResponse]) => {
      const validResponses = brandResponses.filter(r => r !== null);

      // Build bestseller products map by brand ID
      const bestsellersByBrand = {};
      (bestsellerResponses || []).forEach(({ brandId, data = [], included = [] }) => {
        if (data.length > 0) {
          // Randomize and select up to 4 bestseller products
          bestsellersByBrand[brandId] = {
            data: pickRandom(data, 4),
            included,
          };
        }
      });

      // Filter out any invalid user objects
      const users = validResponses
        .map(r => r?.data)
        .filter(user => {
          return (
            user &&
            typeof user === 'object' &&
            user.id &&
            user.id.uuid &&
            user.type === 'user' &&
            user.attributes
          );
        });

      // Filter included entities to ensure they're valid
      const included = validResponses
        .flatMap(r => r?.included || [])
        .filter(entity => {
          return (
            entity &&
            typeof entity === 'object' &&
            entity.id &&
            entity.id.uuid &&
            entity.type
          );
        });

      // Create clean copies of user objects without any problematic properties
      const validUsers = users
        .filter(u => u !== undefined && u !== null)
        .map(user => {
          // Build a clean user object from scratch
          const cleanUser = {
            id: user.id,
            type: user.type,
            attributes: user.attributes,
          };

          // Only include relationships if they exist and have valid (non-null) data
          if (user.relationships) {
            const cleanRelationships = {};
            Object.keys(user.relationships).forEach(key => {
              const rel = user.relationships[key];
              // Only include relationships where data is not null
              if (rel && rel.data && rel.data !== null) {
                cleanRelationships[key] = rel;
              }
            });
            // Only add relationships property if there are valid relationships
            if (Object.keys(cleanRelationships).length > 0) {
              cleanUser.relationships = cleanRelationships;
            }
          }

          return cleanUser;
        });

      const validIncluded = included.filter(e => e !== undefined && e !== null);

      // Process configured products response
      const configProducts = configProductsResponse.data || [];
      const configProductImages = configProductsResponse.included || [];

      // Filter valid configured products
      const validConfigProducts = configProducts.filter(
        listing =>
          listing &&
          typeof listing === 'object' &&
          listing.id &&
          listing.id.uuid &&
          listing.type === 'listing'
      );

      const validConfigProductImages = configProductImages.filter(
        entity =>
          entity &&
          typeof entity === 'object' &&
          entity.id &&
          entity.id.uuid &&
          entity.type === 'image'
      );

      // Process bestseller products and include them
      let bestsellerProducts = [];
      let bestsellerImages = [];
      Object.values(bestsellersByBrand).forEach(({ data = [], included = [] }) => {
        bestsellerProducts = bestsellerProducts.concat(
          data.filter(
            listing =>
              listing &&
              typeof listing === 'object' &&
              listing.id &&
              listing.id.uuid &&
              listing.type === 'listing'
          )
        );
        bestsellerImages = bestsellerImages.concat(
          included.filter(
            entity =>
              entity &&
              typeof entity === 'object' &&
              entity.id &&
              entity.id.uuid &&
              entity.type === 'image'
          )
        );
      });

      // Combine all entities (users + configured products + bestseller products + images)
      const allEntities = [...validUsers, ...validConfigProducts, ...bestsellerProducts];
      const allIncluded = [...validIncluded, ...validConfigProductImages, ...bestsellerImages];

      // Only dispatch if we have valid data
      if (allEntities.length > 0 || allIncluded.length > 0) {
        // Build entity payload
        const entityPayload = { data: allEntities };
        if (allIncluded.length > 0) {
          entityPayload.included = allIncluded;
        }

        // Wrap in sdkResponse format that addMarketplaceEntities expects
        dispatch(addMarketplaceEntities({ data: entityPayload }));
      }

      const successfulBrandIds = validUsers.map(user => user.id.uuid);
      dispatch(fetchFeaturedBrandsSuccess(successfulBrandIds));

      // Store bestseller products metadata for selector to use
      dispatch(setBestsellerProducts(bestsellersByBrand));

      return { data: validUsers };
    })
    .catch(e => {
      dispatch(fetchFeaturedBrandsError(storableError(e)));
      throw e;
    });
};

/**
 * Load data for server-side rendering
 */
export const loadData = (params, search) => dispatch => {
  const { page = 1, perPage = 24 } = params;
  // Only fetch all brands for the /brands page.
  // Homepage random brands are fetched client-side by HeroSection and FeaturedBrandPartners.
  return dispatch(fetchBrands({ page, perPage }));
};

// ================ Selectors ================ //

/**
 * Get brand user entities from marketplace data (denormalized with profileImage)
 */
export const getBrands = state => {
  const { brandIds } = state.BrandsPage;
  const { entities } = state.marketplaceData;

  // Create entity references for denormalization
  const entityRefs = brandIds.map(id => ({ id: { uuid: id }, type: 'user' }));

  // Denormalize to include profileImage relationships
  const throwIfNotFound = false;
  return denormalisedEntities(entities, entityRefs, throwIfNotFound);
};

/**
 * Get brands with their featured products
 * Returns array of { brand, products } objects
 */
export const getBrandsWithProducts = state => {
  const { brandIds, bestsellerProductsByBrand } = state.BrandsPage;
  const { entities } = state.marketplaceData;

  // Get denormalized brands
  const brands = denormalisedEntities(
    entities,
    brandIds.map(id => ({ id: { uuid: id }, type: 'user' })),
    false
  );

  // Attach products to each brand
  return brands.map(brand => {
    const brandId = brand.id.uuid;
    const brandConfig = getBrandConfiguration(brandId);

    // Try to use bestseller products first; fallback to configured products
    let products = [];
    const bestsellerInfo = bestsellerProductsByBrand?.[brandId];

    if (bestsellerInfo?.data && bestsellerInfo.data.length > 0) {
      // Denormalize bestseller product IDs to attach images from marketplace entities
      products = denormalisedEntities(
        entities,
        bestsellerInfo.data.map(listing => ({ id: { uuid: listing.id.uuid }, type: 'listing' })),
        false
      );
    } else {
      // Fallback to configured featured product IDs
      const configuredProductIds = brandConfig?.featuredProductIds || [];
      products = denormalisedEntities(
        entities,
        configuredProductIds.map(id => ({ id: { uuid: id }, type: 'listing' })),
        false
      );
    }

    return {
      brand,
      products,
    };
  });
};

export const getFeaturedBrands = state => {
  const { featuredBrandIds } = state.BrandsPage;
  const { entities } = state.marketplaceData;

  // Create entity references for denormalization
  const entityRefs = featuredBrandIds.map(id => ({ id: { uuid: id }, type: 'user' }));

  // Denormalize to include profileImage relationships
  const throwIfNotFound = false;
  return denormalisedEntities(entities, entityRefs, throwIfNotFound);
};

/**
 * Get featured brands with their featured products
 * Returns array of { brand, products } objects
 */
export const getFeaturedBrandsWithProducts = state => {
  const { featuredBrandIds, bestsellerProductsByBrand } = state.BrandsPage;
  const { entities } = state.marketplaceData;

  // Get denormalized brands
  const brands = denormalisedEntities(
    entities,
    featuredBrandIds.map(id => ({ id: { uuid: id }, type: 'user' })),
    false
  );

  // Attach products to each brand
  return brands.map(brand => {
    const brandId = brand.id.uuid;
    const brandConfig = getBrandConfiguration(brandId);

    // Try to use bestseller products first; fallback to configured products
    let products = [];
    const bestsellerInfo = bestsellerProductsByBrand?.[brandId];

    if (bestsellerInfo?.data && bestsellerInfo.data.length > 0) {
      // Denormalize bestseller product IDs to attach images from marketplace entities
      products = denormalisedEntities(
        entities,
        bestsellerInfo.data.map(listing => ({ id: { uuid: listing.id.uuid }, type: 'listing' })),
        false
      );
    } else {
      // Fallback to configured featured product IDs
      const configuredProductIds = brandConfig?.featuredProductIds || [];
      products = denormalisedEntities(
        entities,
        configuredProductIds.map(id => ({ id: { uuid: id }, type: 'listing' })),
        false
      );
    }

    return {
      brand,
      products,
    };
  });
};

/**
 * Get all brands grouped by category
 * Returns an object keyed by category id, each value is an array of { brand, products }
 */
export const getBrandsGroupedByCategory = state => {
  const all = getBrandsWithProducts(state);
  const groups = {};
  all.forEach(({ brand, products }) => {
    const cat = getBrandCategory(brand.id.uuid) || 'uncategorized';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ brand, products });
  });
  return groups;
};

export const getBrandsPagination = state => state.BrandsPage.pagination;
export const getBrandsInProgress = state => state.BrandsPage.fetchBrandsInProgress;
export const getBrandsError = state => state.BrandsPage.fetchBrandsError;
export const getFeaturedBrandsInProgress = state =>
  state.BrandsPage.fetchFeaturedBrandsInProgress;
export const getFeaturedBrandsError = state => state.BrandsPage.fetchFeaturedBrandsError;
