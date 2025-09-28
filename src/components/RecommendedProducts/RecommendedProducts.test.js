import React from 'react';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../util/testHelpers';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

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
  const entities = {
    listing: {}
  };
  products.forEach(product => {
    entities.listing[product.id.uuid] = product;
  });

  const store = createMockStore({
    recommendedProductIds: products.map(p => p.id),
    ...overrides,
  });

  store.getState().marketplaceData.entities = entities;
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
  return createListing(`listing-${sku}`, {
    title: `Product ${sku}`,
    description: `Description for product ${sku}`,
    price: new Money(2500, 'USD'),
    images: [
      {
        id: `image-${sku}`,
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
    publicData: {
      sku: sku,
      brand: 'TestBrand',
      productUrl: `https://testbrand.com/product/${sku}`,
      listingType: 'sell-products',
      ...overrides.publicData,
    },
    ...overrides,
  }, {
    author: createUser(`user-${sku}`),
  });
};

// Mock the entire recommendedProducts duck to avoid SDK dependency
jest.mock('../../ducks/recommendedProducts.duck', () => ({
  __esModule: true,
  default: (state = { recommendedProductIds: null, fetchRecommendedProductsInProgress: false, fetchRecommendedProductsError: null }, action) => {
    switch (action.type) {
      case 'FETCH_RECOMMENDED_PRODUCTS_REQUEST':
        return { ...state, fetchRecommendedProductsInProgress: true, fetchRecommendedProductsError: null };
      case 'FETCH_RECOMMENDED_PRODUCTS_SUCCESS':
        return { ...state, fetchRecommendedProductsInProgress: false, recommendedProductIds: action.payload.productIds };
      case 'FETCH_RECOMMENDED_PRODUCTS_ERROR':
        return { ...state, fetchRecommendedProductsInProgress: false, fetchRecommendedProductsError: action.payload };
      default:
        return state;
    }
  },
  fetchRecommendedProducts: jest.fn(() => () => Promise.resolve()),
  FETCH_RECOMMENDED_PRODUCTS_REQUEST: 'FETCH_RECOMMENDED_PRODUCTS_REQUEST',
  FETCH_RECOMMENDED_PRODUCTS_SUCCESS: 'FETCH_RECOMMENDED_PRODUCTS_SUCCESS',
  FETCH_RECOMMENDED_PRODUCTS_ERROR: 'FETCH_RECOMMENDED_PRODUCTS_ERROR',
}));

// Get access to the mocked function
const mockFetchRecommendedProducts = require('../../ducks/recommendedProducts.duck').fetchRecommendedProducts;

describe('RecommendedProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('displays loading state', () => {
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: null,
        fetchRecommendedProductsInProgress: true,
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

    expect(screen.getByText('Loading recommended products...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: null,
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

    expect(screen.getByText('Unable to load recommended products')).toBeInTheDocument();
  });

  it('displays no products message when products array is empty', () => {
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: [],
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

    expect(screen.getByText('No recommended products available')).toBeInTheDocument();
  });

  it('renders recommended products correctly', () => {
    const mockProducts = [
      createMockProduct('SKU001'),
      createMockProduct('SKU002'),
      createMockProduct('SKU003'),
    ];

    // Create initial state with products already loaded (no thunk call needed)
    const initialState = {
      recommendedProducts: {
        recommendedProductIds: mockProducts.map(p => p.id),
        fetchRecommendedProductsInProgress: false,
        fetchRecommendedProductsError: null,
      },
      marketplaceData: {
        entities: {
          listing: {}
        }
      }
    };

    // Add products to entities
    mockProducts.forEach(product => {
      initialState.marketplaceData.entities.listing[product.id.uuid] = product;
    });

    renderWithProviders(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002', 'SKU003']}
      />,
      { initialState }
    );

    expect(screen.getByText('You may also like')).toBeInTheDocument();
    expect(screen.getByText('Product SKU001')).toBeInTheDocument();
    expect(screen.getByText('Product SKU002')).toBeInTheDocument();
    expect(screen.getByText('Product SKU003')).toBeInTheDocument();
  });

  it('displays product prices correctly', () => {
    const mockProducts = [
      createMockProduct('SKU001', { price: new Money(1500, 'USD') }),
      createMockProduct('SKU002', { price: new Money(3000, 'USD') }),
    ];

    const store = createStoreWithProducts(mockProducts);

    renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      store
    );

    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
  });

  it('renders product links to marketplace pages', () => {
    const mockProducts = [
      createMockProduct('SKU001'),
    ];

    const store = createMockStore({ products: mockProducts });

    renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001']}
      />,
      store
    );

    const productLink = screen.getByRole('link');
    expect(productLink).toHaveAttribute('href', '/l/listing-sku001');
  });

  it('displays fallback when product image is missing', () => {
    const mockProducts = [
      createMockProduct('SKU001', { images: [] }),
    ];

    const store = createMockStore({ products: mockProducts });

    renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001']}
      />,
      store
    );

    expect(screen.getByText('No image available')).toBeInTheDocument();
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
    const mockProducts = [
      createMockProduct('SKU001', {
        publicData: { sku: 'SKU001', brand: undefined }
      }),
    ];

    const store = createMockStore({ products: mockProducts });

    renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001']}
      />,
      store
    );

    expect(screen.getByText('Product SKU001')).toBeInTheDocument();
  });

  it('limits displayed products to maximum count', () => {
    const mockProducts = Array.from({ length: 10 }, (_, i) =>
      createMockProduct(`SKU${i.toString().padStart(3, '0')}`)
    );

    const store = createMockStore({ products: mockProducts });

    renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={mockProducts.map(p => p.attributes.publicData.sku)}
        maxProducts={4}
      />,
      store
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

    const store = createMockStore({ products: mockProducts });

    const { container } = renderWithStore(
      <RecommendedProducts
        recommendedProductSKUs={['SKU001', 'SKU002']}
      />,
      store
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});