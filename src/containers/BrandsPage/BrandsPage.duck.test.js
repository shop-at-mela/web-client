import {
  FETCH_BRANDS_REQUEST,
  FETCH_BRANDS_SUCCESS,
  FETCH_BRANDS_ERROR,
  FETCH_FEATURED_BRANDS_REQUEST,
  FETCH_FEATURED_BRANDS_SUCCESS,
  FETCH_FEATURED_BRANDS_ERROR,
  SET_BESTSELLER_PRODUCTS,
  fetchBrandsRequest,
  fetchBrandsSuccess,
  fetchBrandsError,
  fetchFeaturedBrandsRequest,
  fetchFeaturedBrandsSuccess,
  fetchFeaturedBrandsError,
  setBestsellerProducts,
  fetchBrands,
  fetchFeaturedBrands,
  getBrandsWithProducts,
  getFeaturedBrandsWithProducts,
} from './BrandsPage.duck';
import brandsPageReducer from './BrandsPage.duck';

describe('BrandsPage Duck', () => {
  describe('Action Creators', () => {
    describe('fetchBrandsRequest', () => {
      it('should return action with correct type', () => {
        const action = fetchBrandsRequest();
        expect(action.type).toBe(FETCH_BRANDS_REQUEST);
      });
    });

    describe('fetchBrandsSuccess', () => {
      it('should return action with brandIds and pagination', () => {
        const brandIds = ['id1', 'id2'];
        const pagination = { page: 1, perPage: 24, totalPages: 5, totalItems: 100 };
        const action = fetchBrandsSuccess(brandIds, pagination);

        expect(action.type).toBe(FETCH_BRANDS_SUCCESS);
        expect(action.payload.brandIds).toEqual(brandIds);
        expect(action.payload.pagination).toEqual(pagination);
      });
    });

    describe('fetchBrandsError', () => {
      it('should return action with error payload', () => {
        const error = new Error('Failed to fetch');
        const action = fetchBrandsError(error);

        expect(action.type).toBe(FETCH_BRANDS_ERROR);
        expect(action.payload).toEqual(error);
        expect(action.error).toBe(true);
      });
    });

    describe('setBestsellerProducts', () => {
      it('should return action with bestseller products map', () => {
        const bestsellersByBrand = {
          'brand-id-1': {
            data: [{ id: { uuid: 'listing-1' }, type: 'listing' }],
            included: [],
          },
        };
        const action = setBestsellerProducts(bestsellersByBrand);

        expect(action.type).toBe(SET_BESTSELLER_PRODUCTS);
        expect(action.payload).toEqual(bestsellersByBrand);
      });
    });

    describe('fetchFeaturedBrandsRequest', () => {
      it('should return action with correct type', () => {
        const action = fetchFeaturedBrandsRequest();
        expect(action.type).toBe(FETCH_FEATURED_BRANDS_REQUEST);
      });
    });

    describe('fetchFeaturedBrandsSuccess', () => {
      it('should return action with featured brand IDs', () => {
        const brandIds = ['featured-1', 'featured-2'];
        const action = fetchFeaturedBrandsSuccess(brandIds);

        expect(action.type).toBe(FETCH_FEATURED_BRANDS_SUCCESS);
        expect(action.payload.brandIds).toEqual(brandIds);
      });
    });

    describe('fetchFeaturedBrandsError', () => {
      it('should return action with error', () => {
        const error = new Error('Featured fetch failed');
        const action = fetchFeaturedBrandsError(error);

        expect(action.type).toBe(FETCH_FEATURED_BRANDS_ERROR);
        expect(action.payload).toEqual(error);
        expect(action.error).toBe(true);
      });
    });
  });

  describe('Reducer', () => {
    const initialState = {
      brandIds: [],
      featuredBrandIds: [],
      pagination: null,
      fetchBrandsInProgress: false,
      fetchBrandsError: null,
      fetchFeaturedBrandsInProgress: false,
      fetchFeaturedBrandsError: null,
      bestsellerProductsByBrand: {},
    };

    it('should return initial state', () => {
      const state = brandsPageReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    describe('FETCH_BRANDS_REQUEST', () => {
      it('should set fetchBrandsInProgress to true and clear error', () => {
        const state = brandsPageReducer(initialState, {
          type: FETCH_BRANDS_REQUEST,
        });

        expect(state.fetchBrandsInProgress).toBe(true);
        expect(state.fetchBrandsError).toBe(null);
      });
    });

    describe('FETCH_BRANDS_SUCCESS', () => {
      it('should set brand IDs and pagination, clear loading state', () => {
        const brandIds = ['brand-1', 'brand-2'];
        const pagination = { page: 1, perPage: 24, totalPages: 5, totalItems: 100 };

        const state = brandsPageReducer(
          { ...initialState, fetchBrandsInProgress: true },
          {
            type: FETCH_BRANDS_SUCCESS,
            payload: { brandIds, pagination },
          }
        );

        expect(state.brandIds).toEqual(brandIds);
        expect(state.pagination).toEqual(pagination);
        expect(state.fetchBrandsInProgress).toBe(false);
      });

      it('should append brand IDs on pagination', () => {
        const existingState = {
          ...initialState,
          brandIds: ['existing-1', 'existing-2'],
        };

        const newBrandIds = ['brand-3', 'brand-4'];
        const pagination = { page: 2, perPage: 24 };

        const state = brandsPageReducer(existingState, {
          type: FETCH_BRANDS_SUCCESS,
          payload: { brandIds: newBrandIds, pagination },
        });

        expect(state.brandIds).toEqual(['existing-1', 'existing-2', 'brand-3', 'brand-4']);
      });

      it('should replace brand IDs on first page', () => {
        const existingState = {
          ...initialState,
          brandIds: ['old-1', 'old-2'],
        };

        const newBrandIds = ['new-1', 'new-2'];
        const pagination = { page: 1, perPage: 24 };

        const state = brandsPageReducer(existingState, {
          type: FETCH_BRANDS_SUCCESS,
          payload: { brandIds: newBrandIds, pagination },
        });

        expect(state.brandIds).toEqual(newBrandIds);
      });
    });

    describe('FETCH_BRANDS_ERROR', () => {
      it('should set error and clear loading state', () => {
        const error = new Error('Fetch failed');

        const state = brandsPageReducer(
          { ...initialState, fetchBrandsInProgress: true },
          {
            type: FETCH_BRANDS_ERROR,
            payload: error,
          }
        );

        expect(state.fetchBrandsError).toEqual(error);
        expect(state.fetchBrandsInProgress).toBe(false);
      });
    });

    describe('SET_BESTSELLER_PRODUCTS', () => {
      it('should set bestseller products by brand', () => {
        const bestsellersByBrand = {
          'brand-1': {
            data: [{ id: { uuid: 'listing-1' } }],
            included: [{ id: { uuid: 'image-1' } }],
          },
        };

        const state = brandsPageReducer(initialState, {
          type: SET_BESTSELLER_PRODUCTS,
          payload: bestsellersByBrand,
        });

        expect(state.bestsellerProductsByBrand).toEqual(bestsellersByBrand);
      });
    });

    describe('FETCH_FEATURED_BRANDS_REQUEST', () => {
      it('should set fetchFeaturedBrandsInProgress to true', () => {
        const state = brandsPageReducer(initialState, {
          type: FETCH_FEATURED_BRANDS_REQUEST,
        });

        expect(state.fetchFeaturedBrandsInProgress).toBe(true);
        expect(state.fetchFeaturedBrandsError).toBe(null);
      });
    });

    describe('FETCH_FEATURED_BRANDS_SUCCESS', () => {
      it('should set featured brand IDs and clear loading', () => {
        const brandIds = ['featured-1', 'featured-2'];

        const state = brandsPageReducer(
          { ...initialState, fetchFeaturedBrandsInProgress: true },
          {
            type: FETCH_FEATURED_BRANDS_SUCCESS,
            payload: { brandIds },
          }
        );

        expect(state.featuredBrandIds).toEqual(brandIds);
        expect(state.fetchFeaturedBrandsInProgress).toBe(false);
      });
    });

    describe('FETCH_FEATURED_BRANDS_ERROR', () => {
      it('should set error and clear loading state', () => {
        const error = new Error('Featured fetch failed');

        const state = brandsPageReducer(
          { ...initialState, fetchFeaturedBrandsInProgress: true },
          {
            type: FETCH_FEATURED_BRANDS_ERROR,
            payload: error,
          }
        );

        expect(state.fetchFeaturedBrandsError).toEqual(error);
        expect(state.fetchFeaturedBrandsInProgress).toBe(false);
      });
    });
  });

  describe('Selectors', () => {
    const mockEntities = {
      user: {
        'brand-1': {
          id: { uuid: 'brand-1' },
          type: 'user',
          attributes: { profile: { displayName: 'Brand 1' } },
        },
      },
      listing: {
        'listing-config-1': {
          id: { uuid: 'listing-config-1' },
          type: 'listing',
          attributes: { title: 'Config Product 1' },
          relationships: {
            images: {
              data: [{ id: { uuid: 'image-1' }, type: 'image' }],
            },
          },
        },
        'listing-bestseller-1': {
          id: { uuid: 'listing-bestseller-1' },
          type: 'listing',
          attributes: { title: 'Bestseller Product 1' },
          relationships: {
            images: {
              data: [{ id: { uuid: 'image-bs-1' }, type: 'image' }],
            },
          },
        },
      },
      image: {
        'image-1': {
          id: { uuid: 'image-1' },
          type: 'image',
          attributes: {
            variants: {
              'square-small': { url: 'http://example.com/image-1.jpg' },
            },
          },
        },
        'image-bs-1': {
          id: { uuid: 'image-bs-1' },
          type: 'image',
          attributes: {
            variants: {
              'square-small': { url: 'http://example.com/image-bs-1.jpg' },
            },
          },
        },
      },
    };

    describe('getBrandsWithProducts', () => {
      it('should use bestseller products when available', () => {
        const state = {
          BrandsPage: {
            brandIds: ['brand-1'],
            bestsellerProductsByBrand: {
              'brand-1': {
                data: [
                  {
                    id: { uuid: 'listing-bestseller-1' },
                    type: 'listing',
                  },
                ],
                included: [],
              },
            },
          },
          marketplaceData: {
            entities: mockEntities,
          },
        };

        const result = getBrandsWithProducts(state);

        expect(result).toHaveLength(1);
        expect(result[0].brand.id.uuid).toBe('brand-1');
        expect(result[0].products).toHaveLength(1);
        expect(result[0].products[0].id.uuid).toBe('listing-bestseller-1');
      });

      it('should fallback to configured products when no bestsellers', () => {
        const state = {
          BrandsPage: {
            brandIds: ['brand-1'],
            bestsellerProductsByBrand: {},
          },
          marketplaceData: {
            entities: mockEntities,
          },
        };

        // Mock getBrandConfiguration to return configured product IDs
        jest.doMock('../../config/configBrands', () => ({
          getBrandConfiguration: () => ({
            featuredProductIds: ['listing-config-1'],
          }),
          getBrandCategory: () => 'baby_and_kids',
        }));

        const result = getBrandsWithProducts(state);

        expect(result).toHaveLength(1);
        expect(result[0].products).toHaveLength(1);
        expect(result[0].products[0].id.uuid).toBe('listing-config-1');
      });

      it('should return empty products when no bestsellers or config', () => {
        const state = {
          BrandsPage: {
            brandIds: ['brand-1'],
            bestsellerProductsByBrand: {},
          },
          marketplaceData: {
            entities: mockEntities,
          },
        };

        jest.doMock('../../config/configBrands', () => ({
          getBrandConfiguration: () => ({
            featuredProductIds: [],
          }),
          getBrandCategory: () => 'baby_and_kids',
        }));

        const result = getBrandsWithProducts(state);

        expect(result).toHaveLength(1);
        expect(result[0].products).toHaveLength(0);
      });
    });

    describe('getFeaturedBrandsWithProducts', () => {
      it('should use bestseller products when available for featured brands', () => {
        const state = {
          BrandsPage: {
            featuredBrandIds: ['brand-1'],
            bestsellerProductsByBrand: {
              'brand-1': {
                data: [
                  {
                    id: { uuid: 'listing-bestseller-1' },
                    type: 'listing',
                  },
                ],
                included: [],
              },
            },
          },
          marketplaceData: {
            entities: mockEntities,
          },
        };

        const result = getFeaturedBrandsWithProducts(state);

        expect(result).toHaveLength(1);
        expect(result[0].products).toHaveLength(1);
        expect(result[0].products[0].id.uuid).toBe('listing-bestseller-1');
      });
    });
  });

  describe('Thunks', () => {
    const mockSdk = {
      users: {
        show: jest.fn(),
      },
      listings: {
        query: jest.fn(),
      },
    };

    const mockDispatch = jest.fn();
    const mockGetState = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('fetchBrands', () => {
      it('should dispatch request, then success with brands', async () => {
        const brandId = 'test-brand-id';
        const mockBrandResponse = {
          data: {
            data: {
              id: { uuid: brandId },
              type: 'user',
              attributes: { profile: { displayName: 'Test Brand' } },
            },
          },
        };

        const mockProductsResponse = {
          data: {
            data: [],
            included: [],
          },
        };

        mockSdk.users.show.mockResolvedValue(mockBrandResponse);
        mockSdk.listings.query.mockResolvedValue(mockProductsResponse);

        jest.doMock('../../config/configBrands', () => ({
          getPaginatedBrandIds: () => ({
            brandIds: [brandId],
            totalPages: 1,
            totalItems: 1,
          }),
          getFeaturedProductIds: () => [],
          getBrandConfiguration: () => ({ featuredProductIds: [] }),
        }));

        await fetchBrands({ page: 1, perPage: 24 })(mockDispatch, mockGetState, mockSdk);

        // Verify dispatch was called with success
        const successCalls = mockDispatch.mock.calls.filter(
          call => call[0]?.type === FETCH_BRANDS_SUCCESS
        );
        expect(successCalls.length).toBeGreaterThan(0);
      });

      it('should handle bestseller fetch errors gracefully', async () => {
        const brandId = 'test-brand-id';
        const mockBrandResponse = {
          data: {
            data: {
              id: { uuid: brandId },
              type: 'user',
              attributes: { profile: { displayName: 'Test Brand' } },
            },
          },
        };

        mockSdk.users.show.mockResolvedValue(mockBrandResponse);
        mockSdk.listings.query
          .mockRejectedValueOnce(new Error('Bestseller fetch failed'))
          .mockResolvedValueOnce({ data: { data: [], included: [] } });

        jest.doMock('../../config/configBrands', () => ({
          getPaginatedBrandIds: () => ({
            brandIds: [brandId],
            totalPages: 1,
            totalItems: 1,
          }),
          getFeaturedProductIds: () => [],
          getBrandConfiguration: () => ({ featuredProductIds: [] }),
        }));

        await fetchBrands({ page: 1, perPage: 24 })(mockDispatch, mockGetState, mockSdk);

        // Should still succeed despite bestseller error
        const successCalls = mockDispatch.mock.calls.filter(
          call => call[0]?.type === FETCH_BRANDS_SUCCESS
        );
        expect(successCalls.length).toBeGreaterThan(0);
      });
    });
  });
});
