import reducer, { loadData, searchListings } from './SearchPage.duck';

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
    user: {
      userTypes: [],
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
      await thunk(mockDispatch, mockGetState, mockSdk);

      // Verify SDK was called
      expect(mockQuery).toHaveBeenCalled();
      expect(mockQuery.mock.calls.length).toBe(1);

      const actualParams = mockQuery.mock.calls[0][0];

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

    it('retries the main query on a 429 rate-limit response and then succeeds', async () => {
      const config = createTestConfig();
      const rateLimited = Object.assign(new Error('Too Many Requests'), { status: 429 });
      mockQuery
        .mockRejectedValueOnce(rateLimited)
        .mockResolvedValueOnce({ data: { data: [], meta: {} } });

      const thunk = loadData({}, '?page=1', config);
      await thunk(mockDispatch, mockGetState, mockSdk);

      // First call 429s, the retry succeeds — so the query is issued twice.
      expect(mockQuery.mock.calls.length).toBe(2);
    });
  });

  // Merchandised sort (gifting-festival-traffic-prd Day 2, Phase 3): in a gifting/occasion
  // context the default sort switches to a bestseller-aware order, without disturbing the
  // general createdAt default, explicit user sorts, or the keyword/relevance branch.
  describe('gifting-aware default sort', () => {
    const GIFTING_DEFAULT_SORT = 'pub_isBestseller,createdAt';

    // Config with a realistic sortConfig so defaultSort resolves to 'createdAt' and the
    // relevance branch is exercisable.
    const createSortConfig = () => {
      const config = createTestConfig();
      config.search.sortConfig = {
        active: true,
        queryParamName: 'sort',
        relevanceKey: 'relevance',
        relevanceFilter: 'keywords',
        options: [
          { key: 'createdAt', label: 'Newest' },
          { key: '-createdAt', label: 'Oldest' },
          { key: '-price', label: 'Lowest price' },
          { key: 'relevance', label: 'Relevance' },
        ],
      };
      return config;
    };

    // Dispatches the searchListings thunk directly with a raw searchParams object (the shape
    // searchListingsPayloadCreator receives) and returns the params passed to sdk.listings.query.
    const runSearch = async searchParams => {
      const config = createSortConfig();
      await mockDispatch(searchListings({ searchParams, config }));
      return mockQuery.mock.calls[0][0];
    };

    it('uses the bestseller-aware sort for gifting context with no explicit sort', async () => {
      const params = await runSearch({ giftingContext: true, perPage: 24 });
      expect(params.sort).toBe(GIFTING_DEFAULT_SORT);
    });

    it('lets an explicit user sort win over the gifting default', async () => {
      const params = await runSearch({ giftingContext: true, sort: '-price', perPage: 24 });
      expect(params.sort).toBe('-price');
    });

    it('keeps the plain createdAt default when there is no gifting context', async () => {
      const params = await runSearch({ perPage: 24 });
      expect(params.sort).toBe('createdAt');
    });

    it('still returns no sort (relevance branch) for a keyword search in gifting context', async () => {
      const params = await runSearch({ giftingContext: true, keywords: 'diya', perPage: 24 });
      expect(params.sort).toBeUndefined();
    });

    it('triggers the gifting default from pub_occasion alone (OccasionStrip /s path, no flag)', async () => {
      const params = await runSearch({ pub_occasion: 'has_any:diwali', perPage: 24 });
      expect(params.sort).toBe(GIFTING_DEFAULT_SORT);
      // The occasion filter itself is a real listing query param and must be forwarded.
      expect(params.pub_occasion).toBe('has_any:diwali');
    });

    it('never leaks the giftingContext flag into the sdk.listings.query params', async () => {
      const params = await runSearch({ giftingContext: true, pub_occasion: 'has_any:diwali', perPage: 24 });
      expect(params).not.toHaveProperty('giftingContext');
    });
  });
});

// Regression tests for the category-page cross-contamination bug: rapid navigation
// between two category pages left the previous category's listings on screen because
// (a) a superseded response could overwrite the current one, and (b) a failed search
// (e.g. a 429 from the request burst) left stale results in place.
describe('SearchPage reducer — stale / superseded search handling', () => {
  const listingResponse = ids => ({
    data: {
      data: ids.map(id => ({ id: { uuid: id }, attributes: { deleted: false, state: 'published' } })),
      meta: { totalItems: ids.length, totalPages: 1 },
    },
  });
  const arg = { searchParams: {} };
  const init = () => reducer(undefined, { type: '@@INIT' });

  it('ignores a superseded fulfilled response and applies only the latest search', () => {
    let state = init();
    state = reducer(state, searchListings.pending('req-A', arg));
    state = reducer(state, searchListings.pending('req-B', arg)); // supersedes A
    // A resolves late — must be ignored
    state = reducer(state, searchListings.fulfilled(listingResponse(['a1']), 'req-A', arg));
    expect(state.currentPageResultIds).toEqual([]);
    // B resolves — applied
    state = reducer(state, searchListings.fulfilled(listingResponse(['b1']), 'req-B', arg));
    expect(state.currentPageResultIds.map(r => r.uuid)).toEqual(['b1']);
  });

  it('clears stale results when the latest search fails (e.g. 429)', () => {
    let state = init();
    state = reducer(state, searchListings.pending('req-A', arg));
    state = reducer(state, searchListings.fulfilled(listingResponse(['a1', 'a2']), 'req-A', arg));
    expect(state.currentPageResultIds.length).toBe(2);

    // User navigates to another category; that search starts then fails.
    state = reducer(state, searchListings.pending('req-B', arg));
    const rateLimited = Object.assign(new Error('429'), { status: 429 });
    state = reducer(state, searchListings.rejected(rateLimited, 'req-B', arg, { status: 429 }));

    expect(state.currentPageResultIds).toEqual([]);
    expect(state.pagination).toBeNull();
  });

  it('does not clear current results when a superseded search fails', () => {
    let state = init();
    state = reducer(state, searchListings.pending('req-A', arg));
    state = reducer(state, searchListings.pending('req-B', arg));
    state = reducer(state, searchListings.fulfilled(listingResponse(['b1']), 'req-B', arg));
    // A fails late — must NOT wipe B's results
    state = reducer(state, searchListings.rejected(new Error('boom'), 'req-A', arg));
    expect(state.currentPageResultIds.map(r => r.uuid)).toEqual(['b1']);
  });
});
