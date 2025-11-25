import { loadData } from './SearchPage.duck';

// Mock SDK
const mockQuery = jest.fn();
jest.mock('../../util/sdkLoader', () => ({
  ...jest.requireActual('../../util/sdkLoader'),
  createImageVariantConfig: jest.fn(() => 'image-variant'),
}));

// Mock addMarketplaceEntities
jest.mock('../../ducks/marketplaceData.duck', () => ({
  addMarketplaceEntities: jest.fn(() => ({ type: 'ADD_MARKETPLACE_ENTITIES' })),
}));

describe('SearchPage.duck', () => {
  let mockDispatch;
  let mockGetState;
  let mockSdk;

  const createTestConfig = () => ({
    currency: 'USD',
    listing: {
      listingTypes: [
        {
          listingType: 'sell-bicycles',
          transactionProcess: {
            name: 'default-purchase',
            alias: 'default-purchase/release-1',
          },
          unitType: 'item',
        },
      ],
      listingFields: [],
      enforceValidListingType: false,
    },
    search: {
      defaultFilters: [],
      sortConfig: { active: true, queryParamName: 'sort' },
    },
    categoryConfiguration: {
      categories: [],
    },
    maps: {
      search: {
        sortSearchByDistance: false,
      },
    },
    layout: {
      listingImage: {
        aspectWidth: 1,
        aspectHeight: 1,
        variantPrefix: 'listing-card',
      },
    },
    accessControl: {
      marketplace: {
        private: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({
      data: {
        data: [],
        meta: { totalItems: 0, totalPages: 0 },
      },
    });

    // mockDispatch needs to execute thunks
    mockDispatch = jest.fn(action => {
      if (typeof action === 'function') {
        return action(mockDispatch, mockGetState, mockSdk);
      }
      return action;
    });
    mockGetState = jest.fn(() => ({}));
    mockSdk = {
      listings: {
        query: mockQuery,
      },
    };
  });

  describe('loadData', () => {
    it('calls SDK listings.query with correct parameters', async () => {
      const config = createTestConfig();
      const params = {};
      const search = '?page=1&perPage=24';

      const thunk = loadData(params, search, config);
      const result = await thunk(mockDispatch, mockGetState, mockSdk);

      console.log('mockDispatch calls:', mockDispatch.mock.calls.length);
      console.log('mockQuery calls:', mockQuery.mock.calls.length);
      console.log('Result:', result);

      // Verify SDK was called
      expect(mockQuery).toHaveBeenCalled();
      expect(mockQuery.mock.calls.length).toBe(1);

      // Log the actual call to see what was passed
      const actualParams = mockQuery.mock.calls[0][0];
      console.log('Actual SDK query params:', JSON.stringify(actualParams, null, 2));

      // Basic check that params object exists
      expect(actualParams).toBeDefined();
      expect(typeof actualParams).toBe('object');
    });

    it('includes badge-related fields in listing query', async () => {
      const config = createTestConfig();
      const params = {};
      const search = '?page=1';

      const thunk = loadData(params, search, config);
      await thunk(mockDispatch, mockGetState, mockSdk);

      const queryParams = mockQuery.mock.calls[0][0];

      // Verify new fields are included for badge display
      expect(queryParams['fields.listing']).toContain('createdAt');
      expect(queryParams['fields.listing']).toContain('currentStock');
      expect(queryParams['fields.listing']).toContain('publicData.certification');
      expect(queryParams['fields.listing']).toContain('publicData.isBestseller');
    });

    it('includes existing required fields', async () => {
      const config = createTestConfig();
      const params = {};
      const search = '?page=1';

      const thunk = loadData(params, search, config);
      await thunk(mockDispatch, mockGetState, mockSdk);

      const queryParams = mockQuery.mock.calls[0][0];

      // Verify existing essential fields are still included
      expect(queryParams['fields.listing']).toContain('title');
      expect(queryParams['fields.listing']).toContain('price');
      expect(queryParams['fields.listing']).toContain('state');
      expect(queryParams['fields.listing']).toContain('publicData.listingType');
    });

    it('includes author and images in the include parameter', async () => {
      const config = createTestConfig();
      const params = {};
      const search = '?page=1';

      const thunk = loadData(params, search, config);
      await thunk(mockDispatch, mockGetState, mockSdk);

      const queryParams = mockQuery.mock.calls[0][0];

      expect(queryParams.include).toContain('author');
      expect(queryParams.include).toContain('images');
    });

    it('passes pagination parameters correctly', async () => {
      const config = createTestConfig();
      const params = {};
      const search = '?page=2';

      const thunk = loadData(params, search, config);
      await thunk(mockDispatch, mockGetState, mockSdk);

      const queryParams = mockQuery.mock.calls[0][0];

      expect(queryParams.page).toBe(2);
      expect(queryParams.perPage).toBe(24);
    });
  });
});
