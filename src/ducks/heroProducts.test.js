import { types as sdkTypes } from '../util/sdkLoader';
import { storableError } from '../util/errors';
import heroProductsReducer, {
  FETCH_HERO_PRODUCTS_REQUEST,
  FETCH_HERO_PRODUCTS_SUCCESS,
  FETCH_HERO_PRODUCTS_ERROR,
  fetchHeroProductsRequest,
  fetchHeroProductsSuccess,
  fetchHeroProductsError,
  fetchHeroProducts,
} from './heroProducts.duck';

const { UUID } = sdkTypes;

describe('heroProducts.duck', () => {
  describe('Reducer', () => {
    const initialState = {
      heroProducts: [],
      fetchHeroProductsInProgress: false,
      fetchHeroProductsError: null,
    };

    it('should return the initial state', () => {
      expect(heroProductsReducer(undefined, {})).toEqual(initialState);
    });

    it('should handle FETCH_HERO_PRODUCTS_REQUEST', () => {
      const action = {
        type: FETCH_HERO_PRODUCTS_REQUEST,
      };
      const expectedState = {
        ...initialState,
        fetchHeroProductsInProgress: true,
        fetchHeroProductsError: null,
      };

      expect(heroProductsReducer(initialState, action)).toEqual(expectedState);
    });

    it('should handle FETCH_HERO_PRODUCTS_SUCCESS', () => {
      const mockProducts = [
        { id: new UUID('product1'), attributes: { title: 'Product 1' } },
        { id: new UUID('product2'), attributes: { title: 'Product 2' } },
      ];

      const action = {
        type: FETCH_HERO_PRODUCTS_SUCCESS,
        payload: { data: mockProducts },
      };

      const expectedState = {
        ...initialState,
        heroProducts: mockProducts,
        fetchHeroProductsInProgress: false,
      };

      expect(heroProductsReducer(initialState, action)).toEqual(expectedState);
    });

    it('should handle FETCH_HERO_PRODUCTS_ERROR', () => {
      const error = new Error('API Error');
      const action = {
        type: FETCH_HERO_PRODUCTS_ERROR,
        payload: { error },
        error: true,
      };

      const expectedState = {
        ...initialState,
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: error,
      };

      expect(heroProductsReducer(initialState, action)).toEqual(expectedState);
    });
  });

  describe('Action creators', () => {
    it('should create an action to request hero products', () => {
      const expectedAction = {
        type: FETCH_HERO_PRODUCTS_REQUEST,
      };
      expect(fetchHeroProductsRequest()).toEqual(expectedAction);
    });

    it('should create an action for successful hero products fetch', () => {
      const mockData = [{ id: new UUID('product1') }];
      const expectedAction = {
        type: FETCH_HERO_PRODUCTS_SUCCESS,
        payload: { data: mockData },
      };
      expect(fetchHeroProductsSuccess(mockData)).toEqual(expectedAction);
    });

    it('should create an action for hero products fetch error', () => {
      const error = new Error('API Error');
      const expectedAction = {
        type: FETCH_HERO_PRODUCTS_ERROR,
        payload: { error },
        error: true,
      };
      expect(fetchHeroProductsError(error)).toEqual(expectedAction);
    });
  });

  describe('Thunk', () => {
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

    it('should fetch hero products successfully and randomize selection', async () => {
      const mockListings = [];
      for (let i = 1; i <= 25; i++) {
        mockListings.push({
          id: new UUID(`product${i}`),
          type: 'listing',
          attributes: {
            title: `Product ${i}`,
            price: { amount: 1000 + i, currency: 'USD' },
          },
          relationships: {
            images: { data: [] },
          },
        });
      }

      const mockResponse = {
        data: {
          data: mockListings,
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      const thunk = fetchHeroProducts({});
      await thunk(mockDispatch, mockGetState, mockSdk);

      // Check that request action was dispatched
      expect(mockDispatch).toHaveBeenCalledWith(fetchHeroProductsRequest());

      // Check that SDK was called with correct parameters
      expect(mockSdk.listings.query).toHaveBeenCalledWith({
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
        perPage: 25,
        sort: 'createdAt',
      });

      // Check that success action was dispatched with randomized products
      const successCall = mockDispatch.mock.calls.find(
        call => call[0].type === FETCH_HERO_PRODUCTS_SUCCESS
      );
      expect(successCall).toBeDefined();
      expect(successCall[0].payload.data).toHaveLength(3); // Should select 3 random products

      // Verify that selected products are from the original list
      const selectedProducts = successCall[0].payload.data;
      selectedProducts.forEach(product => {
        expect(mockListings.some(listing => listing.id.uuid === product.id.uuid)).toBe(true);
      });

      // Verify no duplicates in selection
      const selectedIds = selectedProducts.map(p => p.id.uuid);
      expect(new Set(selectedIds).size).toBe(selectedIds.length);
    });

    it('should handle API error correctly', async () => {
      const apiError = new Error('Network error');
      mockSdk.listings.query.mockRejectedValue(apiError);

      const thunk = fetchHeroProducts({});
      await thunk(mockDispatch, mockGetState, mockSdk);

      expect(mockDispatch).toHaveBeenCalledWith(fetchHeroProductsRequest());

      const errorCall = mockDispatch.mock.calls.find(
        call => call[0].type === FETCH_HERO_PRODUCTS_ERROR
      );
      expect(errorCall).toBeDefined();
      expect(errorCall[0].payload.error).toEqual(storableError(apiError));
    });

    it('should handle fewer than 3 products available', async () => {
      const mockListings = [
        {
          id: new UUID('product1'),
          type: 'listing',
          attributes: { title: 'Product 1' },
          relationships: { images: { data: [] } },
        },
        {
          id: new UUID('product2'),
          type: 'listing',
          attributes: { title: 'Product 2' },
          relationships: { images: { data: [] } },
        },
      ];

      const mockResponse = {
        data: {
          data: mockListings,
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      const thunk = fetchHeroProducts({});
      await thunk(mockDispatch, mockGetState, mockSdk);

      const successCall = mockDispatch.mock.calls.find(
        call => call[0].type === FETCH_HERO_PRODUCTS_SUCCESS
      );
      expect(successCall[0].payload.data).toHaveLength(2); // Should select only available products
    });

    it('should handle empty product list', async () => {
      const mockResponse = {
        data: {
          data: [],
          included: [],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      const thunk = fetchHeroProducts({});
      await thunk(mockDispatch, mockGetState, mockSdk);

      const successCall = mockDispatch.mock.calls.find(
        call => call[0].type === FETCH_HERO_PRODUCTS_SUCCESS
      );
      expect(successCall[0].payload.data).toHaveLength(0);
    });

    it('should properly attach images to listings', async () => {
      const mockImage = {
        id: new UUID('image1'),
        type: 'image',
        attributes: {
          variants: {
            'listing-card': { url: 'http://example.com/image.jpg' },
          },
        },
      };

      const mockListing = {
        id: new UUID('product1'),
        type: 'listing',
        attributes: { title: 'Product 1' },
        relationships: {
          images: {
            data: [{ id: mockImage.id, type: 'image' }],
          },
        },
      };

      const mockResponse = {
        data: {
          data: [mockListing],
          included: [mockImage],
        },
      };

      mockSdk.listings.query.mockResolvedValue(mockResponse);

      const thunk = fetchHeroProducts({});
      await thunk(mockDispatch, mockGetState, mockSdk);

      const successCall = mockDispatch.mock.calls.find(
        call => call[0].type === FETCH_HERO_PRODUCTS_SUCCESS
      );

      const productWithImage = successCall[0].payload.data[0];
      expect(productWithImage.attributes.images).toHaveLength(1);
      expect(productWithImage.attributes.images[0]).toEqual(mockImage);
    });
  });
});