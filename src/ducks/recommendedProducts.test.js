import { types as sdkTypes } from '../util/sdkLoader';
import { createListing, createUser } from '../util/testData';
import { storableError } from '../util/errors';

import RecommendedProductsReducer, {
  // Action types
  FETCH_RECOMMENDED_PRODUCTS_REQUEST,
  FETCH_RECOMMENDED_PRODUCTS_SUCCESS,
  FETCH_RECOMMENDED_PRODUCTS_ERROR,

  // Action creators
  fetchRecommendedProductsRequest,
  fetchRecommendedProductsSuccess,
  fetchRecommendedProductsError,

  // Thunk
  fetchRecommendedProducts,
} from './recommendedProducts.duck';

const { Money } = sdkTypes;

const createMockListing = (sku) => {
  return createListing(`listing-${sku}`, {
    title: `Product ${sku}`,
    description: `Description for product ${sku}`,
    price: new Money(2500, 'USD'),
    publicData: {
      sku: sku,
      brand: 'TestBrand',
      productUrl: `https://testbrand.com/product/${sku}`,
      listingType: 'sell-products',
    },
  }, {
    author: createUser(`user-${sku}`),
  });
};

describe('recommendedProducts.duck', () => {
  describe('Action creators', () => {
    it('creates FETCH_RECOMMENDED_PRODUCTS_REQUEST action', () => {
      const expectedAction = {
        type: FETCH_RECOMMENDED_PRODUCTS_REQUEST,
      };

      expect(fetchRecommendedProductsRequest()).toEqual(expectedAction);
    });

    it('creates FETCH_RECOMMENDED_PRODUCTS_SUCCESS action', () => {
      const productIds = ['listing-SKU001', 'listing-SKU002'];
      const products = [createMockListing('SKU001'), createMockListing('SKU002')];
      const expectedAction = {
        type: FETCH_RECOMMENDED_PRODUCTS_SUCCESS,
        payload: { productIds, products },
      };

      expect(fetchRecommendedProductsSuccess(productIds, products)).toEqual(expectedAction);
    });

    it('creates FETCH_RECOMMENDED_PRODUCTS_ERROR action', () => {
      const error = storableError(new Error('Test error'));
      const expectedAction = {
        type: FETCH_RECOMMENDED_PRODUCTS_ERROR,
        payload: error,
      };

      expect(fetchRecommendedProductsError(error)).toEqual(expectedAction);
    });
  });

  describe('Reducer', () => {
    const initialState = {
      recommendedProductIds: null,
      recommendedProducts: [],
      fetchRecommendedProductsInProgress: false,
      fetchRecommendedProductsError: null,
    };

    it('returns initial state', () => {
      expect(RecommendedProductsReducer(undefined, {})).toEqual(initialState);
    });

    it('handles FETCH_RECOMMENDED_PRODUCTS_REQUEST', () => {
      const action = {
        type: FETCH_RECOMMENDED_PRODUCTS_REQUEST,
      };

      const expectedState = {
        ...initialState,
        fetchRecommendedProductsInProgress: true,
        fetchRecommendedProductsError: null,
      };

      expect(RecommendedProductsReducer(initialState, action)).toEqual(expectedState);
    });

    it('handles FETCH_RECOMMENDED_PRODUCTS_SUCCESS', () => {
      const productIds = ['listing-SKU001', 'listing-SKU002'];
      const products = [createMockListing('SKU001'), createMockListing('SKU002')];
      const action = {
        type: FETCH_RECOMMENDED_PRODUCTS_SUCCESS,
        payload: { productIds, products },
      };

      const loadingState = {
        ...initialState,
        fetchRecommendedProductsInProgress: true,
      };

      const expectedState = {
        ...initialState,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
        recommendedProductIds: productIds,
        recommendedProducts: products,
      };

      expect(RecommendedProductsReducer(loadingState, action)).toEqual(expectedState);
    });

    it('handles FETCH_RECOMMENDED_PRODUCTS_ERROR', () => {
      const error = storableError(new Error('Test error'));
      const action = {
        type: FETCH_RECOMMENDED_PRODUCTS_ERROR,
        payload: error,
      };

      const loadingState = {
        ...initialState,
        fetchRecommendedProductsInProgress: true,
      };

      const expectedState = {
        ...initialState,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: error,
      };

      expect(RecommendedProductsReducer(loadingState, action)).toEqual(expectedState);
    });

    it('preserves other state properties', () => {
      const stateWithOtherProps = {
        ...initialState,
        someOtherProp: 'value',
      };

      const action = {
        type: FETCH_RECOMMENDED_PRODUCTS_REQUEST,
        payload: { skus: ['SKU001'] },
      };

      const result = RecommendedProductsReducer(stateWithOtherProps, action);
      expect(result.someOtherProp).toBe('value');
    });
  });

  describe('fetchRecommendedProducts thunk', () => {
    let mockDispatch;
    let mockGetState;
    let mockSdk;

    beforeEach(() => {
      mockDispatch = jest.fn();
      mockGetState = jest.fn();
      mockSdk = {
        listings: {
          query: jest.fn(),
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('dispatches request and success actions on successful fetch', async () => {
      const skus = ['SKU001', 'SKU002'];
      const config = { listing: { listingFields: [] } };
      const mockListings = [createMockListing('SKU001'), createMockListing('SKU002')];
      const mockResponse = {
        data: {
          data: mockListings,
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      await fetchRecommendedProducts(skus, config)(mockDispatch, mockGetState, mockSdk);

      expect(mockDispatch).toHaveBeenCalledWith(fetchRecommendedProductsRequest());
      expect(mockDispatch).toHaveBeenCalledWith(fetchRecommendedProductsSuccess(mockListings.map(l => l.id), mockListings));
    });

    it('dispatches request and error actions on failed fetch', async () => {
      const skus = ['SKU001', 'SKU002'];
      const config = { listing: { listingFields: [] } };
      const mockError = new Error('Network error');

      mockSdk.listings.query.mockRejectedValue(mockError);

      try {
        await fetchRecommendedProducts(skus, config)(mockDispatch, mockGetState, mockSdk);
      } catch (e) {
        // Expected to throw
      }

      expect(mockDispatch).toHaveBeenCalledWith(fetchRecommendedProductsRequest());
      expect(mockDispatch).toHaveBeenCalledWith(fetchRecommendedProductsError(storableError(mockError)));
    });

    it('calls SDK with correct query parameters', async () => {
      const skus = ['SKU001', 'SKU002', 'SKU003'];
      const config = { listing: { listingFields: [] } };
      const mockResponse = {
        data: {
          data: [],
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      await fetchRecommendedProducts(skus, config)(mockDispatch, mockGetState, mockSdk);

      expect(mockSdk.listings.query).toHaveBeenCalledWith({
        pub_sku: skus,
        states: ['published'],
        include: ['images'],
        'fields.listing': ['title', 'price', 'publicData', 'images'],
        'fields.image': ['variants.listing-card', 'variants.listing-card-2x'],
        'imageVariant.listing-card': 'w:400;h:300;fit:crop',
        'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop',
        perPage: 20,
      });
    });

    it('handles empty SKUs array', async () => {
      const skus = [];
      const config = { listing: { listingFields: [] } };

      await fetchRecommendedProducts(skus, config)(mockDispatch, mockGetState, mockSdk);

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockSdk.listings.query).not.toHaveBeenCalled();
    });

    it('handles null or undefined SKUs', async () => {
      const config = { listing: { listingFields: [] } };

      await fetchRecommendedProducts(null, config)(mockDispatch, mockGetState, mockSdk);

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockSdk.listings.query).not.toHaveBeenCalled();
    });

    it('handles duplicate SKUs in query', async () => {
      const skusWithDuplicates = ['SKU001', 'SKU002', 'SKU001', 'SKU003', 'SKU002'];
      const config = { listing: { listingFields: [] } };
      const mockResponse = {
        data: {
          data: [],
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      await fetchRecommendedProducts(skusWithDuplicates, config)(mockDispatch, mockGetState, mockSdk);

      expect(mockSdk.listings.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pub_sku: skusWithDuplicates,
        })
      );
    });

    it('handles partial results when some SKUs are not found', async () => {
      const skus = ['SKU001', 'SKU002', 'SKU003'];
      const foundListings = [createMockListing('SKU001'), createMockListing('SKU003')];
      const mockResponse = {
        data: {
          data: foundListings,
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      await fetchRecommendedProducts(skus)(mockDispatch, mockGetState, mockSdk);

      expect(mockDispatch).toHaveBeenCalledWith(fetchRecommendedProductsSuccess(foundListings.map(l => l.id)));
    });

    it('handles API response with no results', async () => {
      const skus = ['NONEXISTENT1', 'NONEXISTENT2'];
      const mockResponse = {
        data: {
          data: [],
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      await fetchRecommendedProducts(skus)(mockDispatch, mockGetState, mockSdk);

      expect(mockDispatch).toHaveBeenCalledWith(fetchRecommendedProductsSuccess([]));
    });

    it('maintains order of results based on input SKUs', async () => {
      const skus = ['SKU003', 'SKU001', 'SKU002'];
      const mockListings = [
        createMockListing('SKU001'),
        createMockListing('SKU002'),
        createMockListing('SKU003'),
      ];
      const mockResponse = {
        data: {
          data: mockListings,
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      await fetchRecommendedProducts(skus)(mockDispatch, mockGetState, mockSdk);

      // Should maintain original order from SKUs array - the implementation sorts by SKU order
      const successCall = mockDispatch.mock.calls.find(call =>
        call[0].type === FETCH_RECOMMENDED_PRODUCTS_SUCCESS
      );

      // The implementation sorts products by the order they appear in the SKUs array
      const expectedOrder = [
        mockListings.find(l => l.attributes.publicData.sku === 'SKU003'),
        mockListings.find(l => l.attributes.publicData.sku === 'SKU001'),
        mockListings.find(l => l.attributes.publicData.sku === 'SKU002'),
      ].map(l => l.id);

      expect(successCall[0].payload.productIds).toEqual(expectedOrder);
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete workflow from request to success', () => {
      const skus = ['SKU001', 'SKU002'];
      let state = RecommendedProductsReducer(undefined, {});

      // Start request
      state = RecommendedProductsReducer(state, fetchRecommendedProductsRequest());
      expect(state.fetchRecommendedProductsInProgress).toBe(true);
      expect(state.fetchRecommendedProductsError).toBeNull();

      // Complete with success
      const productIds = ['listing-SKU001', 'listing-SKU002'];
      state = RecommendedProductsReducer(state, fetchRecommendedProductsSuccess(productIds));
      expect(state.fetchRecommendedProductsInProgress).toBe(false);
      expect(state.fetchRecommendedProductsError).toBeNull();
      expect(state.recommendedProductIds).toEqual(productIds);
    });

    it('handles complete workflow from request to error', () => {
      const skus = ['SKU001', 'SKU002'];
      let state = RecommendedProductsReducer(undefined, {});

      // Start request
      state = RecommendedProductsReducer(state, fetchRecommendedProductsRequest());
      expect(state.fetchRecommendedProductsInProgress).toBe(true);
      expect(state.fetchRecommendedProductsError).toBeNull();

      // Complete with error
      const error = storableError(new Error('API Error'));
      state = RecommendedProductsReducer(state, fetchRecommendedProductsError(error));
      expect(state.fetchRecommendedProductsInProgress).toBe(false);
      expect(state.fetchRecommendedProductsError).toEqual(error);
      expect(state.recommendedProductIds).toBeNull();
    });
  });
});