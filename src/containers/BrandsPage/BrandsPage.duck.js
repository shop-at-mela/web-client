import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  getFeaturedBrandIds,
  getPaginatedBrandIds,
  getFeaturedProductIds,
  getBrandConfiguration,
} from '../../config/configBrands';
import { denormalisedEntities } from '../../util/data';

// ================ Action types ================ //

export const FETCH_BRANDS_REQUEST = 'app/BrandsPage/FETCH_BRANDS_REQUEST';
export const FETCH_BRANDS_SUCCESS = 'app/BrandsPage/FETCH_BRANDS_SUCCESS';
export const FETCH_BRANDS_ERROR = 'app/BrandsPage/FETCH_BRANDS_ERROR';

export const FETCH_FEATURED_BRANDS_REQUEST = 'app/BrandsPage/FETCH_FEATURED_BRANDS_REQUEST';
export const FETCH_FEATURED_BRANDS_SUCCESS = 'app/BrandsPage/FETCH_FEATURED_BRANDS_SUCCESS';
export const FETCH_FEATURED_BRANDS_ERROR = 'app/BrandsPage/FETCH_FEATURED_BRANDS_ERROR';

// ================ Reducer ================ //

const initialState = {
  brandIds: [],
  featuredBrandIds: [],
  pagination: null,
  fetchBrandsInProgress: false,
  fetchBrandsError: null,
  fetchFeaturedBrandsInProgress: false,
  fetchFeaturedBrandsError: null,
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

  // Wait for both brands and products to fetch in parallel
  return Promise.all([Promise.all(brandPromises), productsPromise])
    .then(([brandResponses, productsResponse]) => {
      // Filter out failed brand requests
      const validResponses = brandResponses.filter(r => r !== null);

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

      // Process products response
      const products = productsResponse.data || [];
      const productImages = productsResponse.included || [];

      // Filter valid products
      const validProducts = products.filter(
        listing =>
          listing &&
          typeof listing === 'object' &&
          listing.id &&
          listing.id.uuid &&
          listing.type === 'listing'
      );

      const validProductImages = productImages.filter(
        entity =>
          entity &&
          typeof entity === 'object' &&
          entity.id &&
          entity.id.uuid &&
          entity.type === 'image'
      );

      // Combine all entities (users + products + images)
      const allEntities = [...validUsers, ...validProducts];
      const allIncluded = [...validIncluded, ...validProductImages];

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

      // Store brand IDs and pagination
      const successfulBrandIds = validUsers.map(user => user.id.uuid);
      dispatch(
        fetchBrandsSuccess(successfulBrandIds, {
          page,
          perPage,
          totalPages,
          totalItems,
        })
      );

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

  const featuredIds = getFeaturedBrandIds();

  if (featuredIds.length === 0) {
    // No featured brands
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

  return Promise.all(brandPromises)
    .then(responses => {
      const validResponses = responses.filter(r => r !== null);

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

      // Only dispatch if we have valid data
      if (validUsers.length > 0 || validIncluded.length > 0) {
        // Build entity payload
        const entityPayload = { data: validUsers };
        if (validIncluded.length > 0) {
          entityPayload.included = validIncluded;
        }

        // Wrap in sdkResponse format that addMarketplaceEntities expects
        dispatch(addMarketplaceEntities({ data: entityPayload }));
      }

      const successfulBrandIds = validUsers.map(user => user.id.uuid);
      dispatch(fetchFeaturedBrandsSuccess(successfulBrandIds));

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

  const promises = [dispatch(fetchBrands({ page, perPage }))];

  // Fetch featured brands on first page load
  if (page === 1 || page === '1') {
    promises.push(dispatch(fetchFeaturedBrands()));
  }

  return Promise.all(promises);
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
  const { brandIds } = state.BrandsPage;
  const { entities } = state.marketplaceData;

  // Get denormalized brands
  const brands = denormalisedEntities(
    entities,
    brandIds.map(id => ({ id: { uuid: id }, type: 'user' })),
    false
  );

  // Attach products to each brand
  return brands.map(brand => {
    const brandConfig = getBrandConfiguration(brand.id.uuid);
    const productIds = brandConfig?.featuredProductIds || [];

    const products = denormalisedEntities(
      entities,
      productIds.map(id => ({ id: { uuid: id }, type: 'listing' })),
      false
    );

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
  const { featuredBrandIds } = state.BrandsPage;
  const { entities } = state.marketplaceData;

  // Get denormalized brands
  const brands = denormalisedEntities(
    entities,
    featuredBrandIds.map(id => ({ id: { uuid: id }, type: 'user' })),
    false
  );

  // Attach products to each brand
  return brands.map(brand => {
    const brandConfig = getBrandConfiguration(brand.id.uuid);
    const productIds = brandConfig?.featuredProductIds || [];

    const products = denormalisedEntities(
      entities,
      productIds.map(id => ({ id: { uuid: id }, type: 'listing' })),
      false
    );

    return {
      brand,
      products,
    };
  });
};

export const getBrandsPagination = state => state.BrandsPage.pagination;
export const getBrandsInProgress = state => state.BrandsPage.fetchBrandsInProgress;
export const getBrandsError = state => state.BrandsPage.fetchBrandsError;
export const getFeaturedBrandsInProgress = state =>
  state.BrandsPage.fetchFeaturedBrandsInProgress;
export const getFeaturedBrandsError = state => state.BrandsPage.fetchFeaturedBrandsError;
