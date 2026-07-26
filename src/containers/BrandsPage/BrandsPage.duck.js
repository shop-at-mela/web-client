import { storableError } from '../../util/errors';
import { pickRandom } from '../../util/listings';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  getCuratedBrandIds,
  getPaginatedBrandIds,
  getFeaturedProductIds,
  getBrandConfiguration,
  getBrandCategory,
  getOrderedSectionBrandIds,
  BRAND_CATEGORIES,
  MIN_BRANDS_FOR_OWN_SECTION,
  MORE_TO_DISCOVER_CATEGORY,
} from '../../config/configBrands';
import { denormalisedEntities } from '../../util/data';

// ================ Utility Functions ================ //

/**
 * Does this brand user carry at least one hero-image source?
 * (`publicData.brandHeroImageIds` — Sharetribe UUIDs — OR `brandHeroImages` —
 * Shopify URLs — is a non-empty array.) Used to filter the hero carousel so
 * BrandHeroCard's skip-if-empty contract never yields an empty slide or a dead
 * dot (brand-hero-card-webclient-prd.md §5).
 */
export const hasHeroImageSource = brand => {
  const publicData = brand?.attributes?.profile?.publicData || {};
  const { brandHeroImageIds, brandHeroImages } = publicData;
  return (
    (Array.isArray(brandHeroImageIds) && brandHeroImageIds.filter(Boolean).length > 0) ||
    (Array.isArray(brandHeroImages) && brandHeroImages.filter(Boolean).length > 0)
  );
};

/**
 * Batch-fetch the Sharetribe listings referenced by the brands'
 * `publicData.brandHeroImageListingIds` so their image entities (and variant
 * URLs) land in marketplaceData for BrandHeroCard to resolve against.
 * Requests the square hero variants PLUS the square-small variants already
 * used app-wide: entity merge is shallow on `attributes`, so a response
 * carrying only hero variants would clobber square-small for images shared
 * with the bestseller grids.
 */
const fetchHeroListings = (sdk, brandUsers) => {
  const heroListingIds = [
    ...new Set(
      brandUsers
        .flatMap(u => u?.attributes?.profile?.publicData?.brandHeroImageListingIds || [])
        .filter(Boolean)
    ),
  ];

  if (heroListingIds.length === 0) {
    return Promise.resolve({ data: [], included: [] });
  }

  return sdk.listings
    .query({
      ids: heroListingIds,
      include: ['images'],
      'fields.listing': ['title'],
      'fields.image': [
        'variants.square-hero',
        'variants.square-hero2x',
        'variants.square-small',
        'variants.square-small2x',
      ],
      'imageVariant.square-hero': 'w:600;h:600;fit:crop',
      'imageVariant.square-hero2x': 'w:1200;h:1200;fit:crop',
      'imageVariant.square-small': 'w:400;h:300;fit:crop',
      'imageVariant.square-small2x': 'w:800;h:600;fit:crop',
      perPage: 100,
    })
    .then(response => {
      const { data = [], included = [] } = response.data || {};
      return { data, included };
    })
    .catch(error => {
      // Non-fatal: BrandHeroCard falls back to the Shopify URL at the same index.
      console.warn('Failed to fetch hero listings:', error);
      return { data: [], included: [] };
    });
};

const fetchBestsellerListingsForBrand = (sdk, brandId) => {
  return sdk.listings
    .query({
      'fields.listing': ['title', 'price', 'publicData', 'images'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
      'imageVariant.square-small': 'w:400;h:300;fit:crop',
      'imageVariant.square-small2x': 'w:800;h:600;fit:crop',
      include: ['author', 'images'],
      author_id: brandId,
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

export const FETCH_HERO_BRANDS_REQUEST = 'app/BrandsPage/FETCH_HERO_BRANDS_REQUEST';
export const FETCH_HERO_BRANDS_SUCCESS = 'app/BrandsPage/FETCH_HERO_BRANDS_SUCCESS';
export const FETCH_HERO_BRANDS_ERROR = 'app/BrandsPage/FETCH_HERO_BRANDS_ERROR';

export const SET_BESTSELLER_PRODUCTS = 'app/BrandsPage/SET_BESTSELLER_PRODUCTS';

// ================ Reducer ================ //

const initialState = {
  brandIds: [],
  featuredBrandIds: [],
  heroBrandIds: [],
  pagination: null,
  fetchBrandsInProgress: false,
  fetchBrandsError: null,
  fetchFeaturedBrandsInProgress: false,
  fetchFeaturedBrandsError: null,
  fetchHeroBrandsInProgress: false,
  fetchHeroBrandsError: null,
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

    case FETCH_HERO_BRANDS_REQUEST:
      return {
        ...state,
        fetchHeroBrandsInProgress: true,
        fetchHeroBrandsError: null,
      };

    case FETCH_HERO_BRANDS_SUCCESS:
      return {
        ...state,
        heroBrandIds: payload.brandIds,
        fetchHeroBrandsInProgress: false,
      };

    case FETCH_HERO_BRANDS_ERROR:
      return {
        ...state,
        fetchHeroBrandsInProgress: false,
        fetchHeroBrandsError: payload,
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

export const fetchHeroBrandsRequest = () => ({
  type: FETCH_HERO_BRANDS_REQUEST,
});

export const fetchHeroBrandsSuccess = brandIds => ({
  type: FETCH_HERO_BRANDS_SUCCESS,
  payload: { brandIds },
});

export const fetchHeroBrandsError = error => ({
  type: FETCH_HERO_BRANDS_ERROR,
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

  const featuredIds = getCuratedBrandIds(10);

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
 * Fetch hero-carousel brand data: a dedicated, lean fetch independent of
 * fetchFeaturedBrands. Two reasons it's separate rather than sharing that
 * thunk/state:
 * 1. BrandHeroCard renders no products at all, so this never runs the
 *    per-brand bestseller-listing queries fetchFeaturedBrands needs for
 *    BrandCardHome's 2x2 grid — cheaper, and it means a brand with a hero
 *    image but zero bestseller/configured products still qualifies (the old
 *    getHeroBrandsWithProducts incorrectly inherited a products-required
 *    filter from getFeaturedBrandsWithProducts).
 * 2. It evaluates ALL curated brand candidates (not just the first 10 used
 *    by fetchFeaturedBrands for FeaturedBrandPartners/BrandCardHome), so hero
 *    coverage isn't capped at whatever fraction of the top 10 happen to have
 *    brandHeroImageIds/brandHeroImages set. Bumping the shared 10-brand fetch
 *    instead would also grow FeaturedBrandPartners' carousel — a different
 *    section this work must not touch.
 */
export const fetchHeroBrands = () => (dispatch, getState, sdk) => {
  dispatch(fetchHeroBrandsRequest());

  const candidateIds = getCuratedBrandIds();

  if (candidateIds.length === 0) {
    dispatch(fetchHeroBrandsSuccess([]));
    return Promise.resolve();
  }

  const brandPromises = candidateIds.map(brandId =>
    sdk.users
      .show({
        id: brandId,
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
        'fields.user': ['profile', 'metadata'],
      })
      .then(response => (response && response.data ? response.data : null))
      .catch(error => {
        console.error(`Failed to fetch hero-candidate brand ${brandId}:`, error);
        return null;
      })
  );

  return Promise.all(brandPromises)
    .then(brandResponses => {
      // Each brandResponses[i] is { data: user, included: [...] } — profile
      // Image (requested via include:['profileImage']) lands in `included`,
      // NOT on the user object itself. Dropping it here (as an earlier
      // version of this thunk did) leaves a dangling relationship: the user
      // entity's relationships.profileImage still points at an image id that
      // was never added to marketplaceData.entities.image, and
      // denormalisedEntities throws synchronously on that dangling reference
      // — crashing mapStateToProps and silently freezing HeroSection's last
      // committed render (no error boundary catches it). Must collect
      // `included` per-brand, same as fetchBrands/fetchFeaturedBrands.
      const brandUsers = brandResponses
        .map(r => r?.data)
        .filter(
          user =>
            user &&
            typeof user === 'object' &&
            user.id &&
            user.id.uuid &&
            user.type === 'user' &&
            user.attributes
        );

      const profileImages = brandResponses
        .flatMap(r => r?.included || [])
        .filter(
          entity =>
            entity &&
            typeof entity === 'object' &&
            entity.id &&
            entity.id.uuid &&
            entity.type === 'image'
        );

      return fetchHeroListings(sdk, brandUsers).then(heroListingsResponse => ({
        brandUsers,
        profileImages,
        heroListingsResponse,
      }));
    })
    .then(({ brandUsers, profileImages, heroListingsResponse }) => {
      // Clean copies (mirrors fetchBrands/fetchFeaturedBrands) — only valid,
      // non-null relationships, no stray SDK response properties.
      const validUsers = brandUsers.map(user => {
        const cleanUser = { id: user.id, type: user.type, attributes: user.attributes };
        if (user.relationships) {
          const cleanRelationships = {};
          Object.keys(user.relationships).forEach(key => {
            const rel = user.relationships[key];
            if (rel && rel.data && rel.data !== null) {
              cleanRelationships[key] = rel;
            }
          });
          if (Object.keys(cleanRelationships).length > 0) {
            cleanUser.relationships = cleanRelationships;
          }
        }
        return cleanUser;
      });

      const heroListings = (heroListingsResponse.data || []).filter(
        listing =>
          listing &&
          typeof listing === 'object' &&
          listing.id &&
          listing.id.uuid &&
          listing.type === 'listing'
      );
      const heroImages = (heroListingsResponse.included || []).filter(
        entity =>
          entity &&
          typeof entity === 'object' &&
          entity.id &&
          entity.id.uuid &&
          entity.type === 'image'
      );

      const allEntities = [...validUsers, ...heroListings];
      const allIncluded = [...profileImages, ...heroImages];

      if (allEntities.length > 0 || allIncluded.length > 0) {
        const entityPayload = { data: allEntities };
        if (allIncluded.length > 0) {
          entityPayload.included = allIncluded;
        }
        dispatch(addMarketplaceEntities({ data: entityPayload }));
      }

      // Eligibility gate lives here (fetch time), not in the selector: only
      // brands with a real hero source become part of heroBrandIds.
      const heroEligibleIds = validUsers.filter(hasHeroImageSource).map(user => user.id.uuid);
      dispatch(fetchHeroBrandsSuccess(heroEligibleIds));

      return { data: validUsers };
    })
    .catch(e => {
      dispatch(fetchHeroBrandsError(storableError(e)));
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
  }).filter(({ products }) => products.length > 0);
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
  }).filter(({ products }) => products.length > 0);
};

/**
 * Hero-carousel slide list (brand-hero-card-webclient-prd.md §5). Built from
 * `heroBrandIds` (fetchHeroBrands' own state, already gated on
 * hasHeroImageSource at fetch time) — deliberately NOT layered on top of
 * getFeaturedBrandsWithProducts, which requires bestseller/configured
 * products to be non-empty. BrandHeroCard renders no products at all, so a
 * brand with a real hero image but zero fetched products must still qualify;
 * gating on products here would silently drop it. Curated order is preserved
 * (heroBrandIds is written from fetchHeroBrands' candidate order, filter-only
 * here, no re-sort). Each entry is augmented with `heroImageUrlById` —
 * Sharetribe image UUID → square hero variant URL. BrandHeroCard falls back
 * to the Shopify URL at the same index for any id missing from the map.
 */
export const getHeroBrands = state => {
  const { heroBrandIds } = state.BrandsPage;
  const { entities } = state.marketplaceData;
  const imageEntities = entities?.image || {};

  const brands = denormalisedEntities(
    entities,
    heroBrandIds.map(id => ({ id: { uuid: id }, type: 'user' })),
    false
  );

  return brands
    .filter(hasHeroImageSource)
    .map(brand => {
      const { brandHeroImageIds = [] } = brand.attributes?.profile?.publicData || {};
      const heroImageUrlById = {};
      (Array.isArray(brandHeroImageIds) ? brandHeroImageIds : []).forEach(imageId => {
        const variants = imageEntities[imageId]?.attributes?.variants || {};
        const url =
          variants['square-hero2x']?.url ||
          variants['square-hero']?.url ||
          variants['square-small2x']?.url ||
          null;
        if (url) {
          heroImageUrlById[imageId] = url;
        }
      });
      return { brand, heroImageUrlById };
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

/**
 * Get /brands page sections: categories with >= MIN_BRANDS_FOR_OWN_SECTION
 * live brands get their own section (ordered biggest-first, so section order
 * follows actual catalog depth rather than a hand-maintained list); every
 * category below that threshold is folded into one MORE_TO_DISCOVER_CATEGORY
 * section, so no section ever renders a header over 2-3 lonely cards. Within
 * each section, brands are ordered via getOrderedSectionBrandIds (stable
 * anchor picks + weekly-seeded rotation) instead of a per-render shuffle.
 *
 * See homepage-hero-prd.md brand-order research/design/critique (2026-07-16).
 *
 * @returns {Array<{id: string, label: string, brands: Array<{brand, products}>}>}
 */
export const getBrandsPageSections = state => {
  const groups = getBrandsGroupedByCategory(state);

  const bigCategories = [];
  const thinCategoryEntries = [];

  BRAND_CATEGORIES.forEach(({ id, label }) => {
    const entries = groups[id] || [];
    if (entries.length >= MIN_BRANDS_FOR_OWN_SECTION) {
      bigCategories.push({ id, label, entries });
    } else {
      thinCategoryEntries.push(...entries);
    }
  });
  // Categories not present in BRAND_CATEGORIES (defensive; shouldn't happen
  // in practice) are treated the same as a thin category.
  if (groups.uncategorized) {
    thinCategoryEntries.push(...groups.uncategorized);
  }

  bigCategories.sort((a, b) => b.entries.length - a.entries.length);

  const sections = [...bigCategories];
  if (thinCategoryEntries.length > 0) {
    sections.push({
      id: MORE_TO_DISCOVER_CATEGORY.id,
      label: MORE_TO_DISCOVER_CATEGORY.label,
      entries: thinCategoryEntries,
    });
  }

  return sections.map(({ id, label, entries }) => {
    const entryById = {};
    entries.forEach(entry => {
      entryById[entry.brand.id.uuid] = entry;
    });
    const orderedIds = getOrderedSectionBrandIds(
      id,
      entries.map(entry => entry.brand.id.uuid)
    );
    return { id, label, brands: orderedIds.map(brandId => entryById[brandId]) };
  });
};

export const getBrandsPagination = state => state.BrandsPage.pagination;
export const getBrandsInProgress = state => state.BrandsPage.fetchBrandsInProgress;
export const getBrandsError = state => state.BrandsPage.fetchBrandsError;
export const getFeaturedBrandsInProgress = state =>
  state.BrandsPage.fetchFeaturedBrandsInProgress;
export const getFeaturedBrandsError = state => state.BrandsPage.fetchFeaturedBrandsError;
export const getHeroBrandsInProgress = state => state.BrandsPage.fetchHeroBrandsInProgress;
export const getHeroBrandsError = state => state.BrandsPage.fetchHeroBrandsError;
