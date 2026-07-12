import React from 'react';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../util/testHelpers';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

import { types as sdkTypes } from '../../util/sdkLoader';
import { createListing, createUser } from '../../util/testData';

import RecommendedProducts from './RecommendedProducts';
import recommendedProductsReducer from '../../ducks/recommendedProducts.duck';

const { Money } = sdkTypes;

const defaultMessages = {
  'RecommendedProducts.title': 'You may also like',
  'RecommendedProducts.heading': 'You may also like',
  'RecommendedProducts.loading': 'Loading recommended products...',
  'RecommendedProducts.loadError': 'Unable to load recommended products',
  'RecommendedProducts.noProducts': 'No recommended products available',
  'RecommendedProducts.noImage': 'No image available',
};

const createMockStore = (initialState = {}) => {
  const rootReducer = combineReducers({
    recommendedProducts: recommendedProductsReducer,
    marketplaceData: (state = { entities: {} }) => state,
  });

  return createStore(rootReducer, {
    recommendedProducts: {
      recommendedProductIds: null,
      recommendedProducts: [],
      fetchRecommendedProductsInProgress: false,
      fetchRecommendedProductsError: null,
      ...initialState,
    },
    marketplaceData: {
      entities: {},
    },
  }, applyMiddleware(thunk));
};

const createStoreWithProducts = (products = [], overrides = {}) => {
  const store = createMockStore({
    recommendedProductIds: products.map(p => p.id),
    recommendedProducts: products,
    ...overrides,
  });

  return store;
};

// Create a custom render function that uses the proper testHelpers renderWithProviders
// but still allows us to mock the dispatch for thunk actions
const renderWithStore = (component, store) => {
  const mockStore = store || createMockStore();

  // Override the dispatch method to capture thunk calls
  const originalDispatch = mockStore.dispatch;
  mockStore.dispatch = jest.fn(action => {
    if (typeof action === 'function') {
      // For thunk actions, call our mock and return a resolved promise
      mockFetchRecommendedProducts();
      return Promise.resolve();
    }
    return originalDispatch(action);
  });

  // Create initial state that matches what the proper store would have
  const state = mockStore.getState();

  return renderWithProviders(component, {
    initialState: state
  });
};

const createMockProduct = (sku, overrides = {}) => {
  const { images, ...attributeOverrides } = overrides;
  return createListing(`listing-${sku}`, {
    title: `Product ${sku}`,
    description: `Description for product ${sku}`,
    price: new Money(2500, 'USD'),
    publicData: {
      sku: sku,
      brand: 'TestBrand',
      productUrl: `https://testbrand.com/product/${sku}`,
      listingType: 'sell-products',
      ...overrides.publicData,
    },
    ...attributeOverrides,
  }, {
    author: createUser(`user-${sku}`),
    // ProductCarousel/ListingCard read images off the top-level entity (JSON:API
    // relationship pattern), not attributes.images — see ProductCarousel.test.js.
    images: images !== undefined ? images : [
      {
        id: { uuid: `image-${sku}` },
        type: 'image',
        attributes: {
          variants: {
            'listing-card': {
              url: `https://example.com/image-${sku}.jpg`,
              width: 400,
              height: 400,
            },
          },
        },
      },
    ],
  });
};

// Mock the entire recommendedProducts duck to avoid SDK dependency
jest.mock('../../ducks/recommendedProducts.duck', () => ({
  __esModule: true,
  default: (state = { recommendedProductIds: null, recommendedProducts: [], fetchRecommendedProductsInProgress: false, fetchRecommendedProductsError: null }, action) => {
    switch (action.type) {
      case 'FETCH_RECOMMENDED_PRODUCTS_REQUEST':
        return { ...state, fetchRecommendedProductsInProgress: true, fetchRecommendedProductsError: null };
      case 'FETCH_RECOMMENDED_PRODUCTS_SUCCESS':
        return { ...state, fetchRecommendedProductsInProgress: false, recommendedProductIds: action.payload.productIds, recommendedProducts: action.payload.products || [] };
      case 'FETCH_RECOMMENDED_PRODUCTS_ERROR':
        return { ...state, fetchRecommendedProductsInProgress: false, fetchRecommendedProductsError: action.payload };
      default:
        return state;
    }
  },
  // No implementation here: package.json sets "resetMocks": true, which wipes any
  // implementation passed to jest.fn() before every test (this factory only runs once
  // when the module is first required). Re-applied in beforeEach below instead.
  fetchRecommendedProducts: jest.fn(),
  FETCH_RECOMMENDED_PRODUCTS_REQUEST: 'FETCH_RECOMMENDED_PRODUCTS_REQUEST',
  FETCH_RECOMMENDED_PRODUCTS_SUCCESS: 'FETCH_RECOMMENDED_PRODUCTS_SUCCESS',
  FETCH_RECOMMENDED_PRODUCTS_ERROR: 'FETCH_RECOMMENDED_PRODUCTS_ERROR',
}));

// Get access to the mocked function
const mockFetchRecommendedProducts = require('../../ducks/recommendedProducts.duck').fetchRecommendedProducts;

describe('RecommendedProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // "resetMocks": true (package.json) wipes mockFetchRecommendedProducts's
    // implementation before every test — reapply it here so dispatch() always
    // receives a proper thunk function instead of undefined.
    mockFetchRecommendedProducts.mockImplementation(() => () => Promise.resolve());
  });

  it('renders nothing when no recommended SKUs provided', () => {
    const { container } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={[]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when recommendedSKUs is null or undefined', () => {
    const { container } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={null}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when recommendedSKUs is not an array', () => {
    const { container } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs="SKU001,SKU002"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles empty array correctly', () => {
    const { container } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={[]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  describe('String parsing helper function tests', () => {
    // Helper function to test the parsing logic used in ListingPage components
    const parseRecommendedProductsSKUs = (recommendedProducts) => {
      return typeof recommendedProducts === 'string'
        ? recommendedProducts.split(',').map(sku => sku.trim()).filter(Boolean)
        : recommendedProducts;
    };

    it('parses comma-separated string correctly', () => {
      const result = parseRecommendedProductsSKUs('SKU001, SKU002, SKU003');
      expect(result).toEqual(['SKU001', 'SKU002', 'SKU003']);
    });

    it('handles extra whitespace in comma-separated string', () => {
      const result = parseRecommendedProductsSKUs('  SKU001  ,  SKU002  ,  SKU003  ');
      expect(result).toEqual(['SKU001', 'SKU002', 'SKU003']);
    });

    it('filters out empty values from comma-separated string', () => {
      const result = parseRecommendedProductsSKUs('SKU001,, SKU002, , SKU003,');
      expect(result).toEqual(['SKU001', 'SKU002', 'SKU003']);
    });

    it('handles single SKU without commas', () => {
      const result = parseRecommendedProductsSKUs('SKU001');
      expect(result).toEqual(['SKU001']);
    });

    it('passes through array format unchanged', () => {
      const input = ['SKU001', 'SKU002', 'SKU003'];
      const result = parseRecommendedProductsSKUs(input);
      expect(result).toEqual(['SKU001', 'SKU002', 'SKU003']);
    });

    it('handles empty string', () => {
      const result = parseRecommendedProductsSKUs('');
      expect(result).toEqual([]);
    });

    it('handles null and undefined', () => {
      expect(parseRecommendedProductsSKUs(null)).toBe(null);
      expect(parseRecommendedProductsSKUs(undefined)).toBe(undefined);
    });
  });

  it('displays loading state', () => {
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: null,
        recommendedProducts: [],
        fetchRecommendedProductsInProgress: true,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    const { container } = renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    // Commit 8d9a322a3 replaced the text-based loading message with ProductCarousel's
    // shared skeleton-placeholder loading state (no text at all) — RecommendedProducts.loading
    // is now a dead translation key.
    expect(container.querySelectorAll('[class*="skeleton"]')).toHaveLength(4);
  });

  it('displays error state', () => {
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: null,
        recommendedProducts: [],
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: { status: 500, statusText: 'Server Error' },
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    expect(screen.getByText('RecommendedProducts.loadError')).toBeInTheDocument();
  });

  it('displays no products message when products array is empty', () => {
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: [],
        recommendedProducts: [],
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    expect(screen.getByText('RecommendedProducts.noProducts')).toBeInTheDocument();
  });

  it('renders recommended products correctly', () => {
    const mockProducts = [
      createMockProduct('SKU001'),
      createMockProduct('SKU002'),
      createMockProduct('SKU003'),
    ];

    // Create initial state with products in recommendedProducts array
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: {
          listing: {}
        }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002', 'SKU003']}
      />,
      { initialState }
    );

    expect(screen.getByText('RecommendedProducts.title')).toBeInTheDocument();
    expect(screen.getByText('Product SKU001')).toBeInTheDocument();
    expect(screen.getByText('Product SKU002')).toBeInTheDocument();
    expect(screen.getByText('Product SKU003')).toBeInTheDocument();
  });

  it('displays product prices correctly', () => {
    const mockProducts = [
      createMockProduct('SKU001', { price: new Money(1500, 'USD') }),
      createMockProduct('SKU002', { price: new Money(3000, 'USD') }),
    ];

    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    // ListingCard wraps the formatted price in a FormattedMessage with a {price} value —
    // the test harness stubs every message to its own id, discarding interpolated values,
    // so the rendered text is literally "ListingCard.price". Check the title attribute
    // (set directly to the formatted price string) instead. Currency formatting here omits
    // trailing cents for whole-dollar amounts (see util/currency.js formatMoney) — same
    // convention noted for EditListingPage's price fields.
    expect(screen.getByTitle('$15')).toBeInTheDocument();
    expect(screen.getByTitle('$30')).toBeInTheDocument();
  });

  it('renders product links to marketplace pages', () => {
    // ProductCarousel's minItems defaults to 2 (see ProductCarousel.js) — a single
    // product isn't enough to render the carousel at all, so add a second one.
    const mockProducts = [
      createMockProduct('SKU001'),
      createMockProduct('SKU002'),
    ];

    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    const { container } = renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    // href is /l/{slug}/{id} (see routeConfiguration's ListingPage route), not just /l/{id}.
    // Each card renders two links (image + info) to the same href, so query directly.
    const productLink = container.querySelector('a[href="/l/product-sku001/listing-SKU001"]');
    expect(productLink).toBeInTheDocument();
  });

  it('omits products with missing images from the carousel', () => {
    // ProductCarousel filters out any listing with no images entirely (see
    // listingsWithImages in ProductCarousel.js) rather than showing a placeholder card —
    // the old per-card "No image available" fallback no longer applies. Two additional
    // valid products are included so the carousel still renders after filtering
    // (minItems default is 2 *after* the imageless product is dropped).
    const mockProducts = [
      createMockProduct('SKU001', { images: [] }),
      createMockProduct('SKU002'),
      createMockProduct('SKU003'),
    ];

    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002', 'SKU003']}
      />,
      { initialState }
    );

    expect(screen.queryByText('Product SKU001')).not.toBeInTheDocument();
    expect(screen.getByText('Product SKU002')).toBeInTheDocument();
    expect(screen.getByText('Product SKU003')).toBeInTheDocument();
  });

  it('calls onFetchProducts with correct SKUs on mount', () => {
    const recommendedSKUs = ['SKU001', 'SKU002', 'SKU003'];

    renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={recommendedSKUs}
      />
    );

    expect(mockFetchRecommendedProducts).toHaveBeenCalled();
  });

  it('calls onFetchProducts when recommendedSKUs change', () => {
    const initialSKUs = ['SKU001', 'SKU002'];
    const newSKUs = ['SKU003', 'SKU004'];

    const { rerender } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={initialSKUs}
      />
    );

    expect(mockFetchRecommendedProducts).toHaveBeenCalled();

    rerender(
      <RecommendedProducts
        recommendedProductSKUs={newSKUs}
      />
    );

    expect(mockFetchRecommendedProducts).toHaveBeenCalledTimes(2);
  });

  it('does not call onFetchProducts when recommendedSKUs remain the same', () => {
    const recommendedSKUs = ['SKU001', 'SKU002'];

    const { rerender } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={recommendedSKUs}
      />
    );

    expect(mockFetchRecommendedProducts).toHaveBeenCalledTimes(1);

    // Re-render with same SKUs
    rerender(
      <RecommendedProducts
        recommendedProductSKUs={recommendedSKUs}
      />
    );

    // Should not call again
    expect(mockFetchRecommendedProducts).toHaveBeenCalledTimes(1);
  });

  it('handles products with missing brand information', () => {
    // ProductCarousel's minItems defaults to 2 — add a second product alongside the
    // one under test so the carousel actually renders.
    const mockProducts = [
      createMockProduct('SKU001', {
        publicData: { sku: 'SKU001', brand: undefined }
      }),
      createMockProduct('SKU002'),
    ];

    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    expect(screen.getByText('Product SKU001')).toBeInTheDocument();
  });

  it('limits displayed products to maximum count', () => {
    const mockProducts = Array.from({ length: 10 }, (_, i) =>
      createMockProduct(`SKU${i.toString().padStart(3, '0')}`)
    );

    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts.slice(0, 4), // Simulate that only 4 products were fetched
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={mockProducts.map(p => p.attributes.publicData.sku).slice(0, 4)}
      />,
      { initialState }
    );

    // Should only display first 4 products
    expect(screen.getByText('Product SKU000')).toBeInTheDocument();
    expect(screen.getByText('Product SKU001')).toBeInTheDocument();
    expect(screen.getByText('Product SKU002')).toBeInTheDocument();
    expect(screen.getByText('Product SKU003')).toBeInTheDocument();
    expect(screen.queryByText('Product SKU004')).not.toBeInTheDocument();
  });

  it('matches snapshot with recommended products', () => {
    const mockProducts = [
      createMockProduct('SKU001'),
      createMockProduct('SKU002'),
    ];

    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        recommendedProducts: mockProducts,
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: { listing: {} }
      }
    };

    const { container } = renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      { initialState }
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});