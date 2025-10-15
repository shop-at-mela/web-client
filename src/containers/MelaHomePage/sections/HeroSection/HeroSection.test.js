import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../../../util/sdkLoader';
import { fakeIntl } from '../../../../util/testData';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import HeroSection from './HeroSection';

const { UUID } = sdkTypes;

// Mock specific components
jest.mock('../../../../components/NamedLink/NamedLink', () => {
  return ({ children, className, params, name, ...props }) => (
    <a className={className} data-testid={`link-${name}`} data-params={JSON.stringify(params || {})} {...props}>
      {children}
    </a>
  );
});

jest.mock('../../../../components/ResponsiveImage/ResponsiveImage', () => {
  return ({ alt, rootClassName }) => (
    <img alt={alt} className={rootClassName} src="test-image.jpg" data-testid="responsive-image" />
  );
});

jest.mock('../../../../components/Button/Button', () => {
  return ({ children, className, ...props }) => (
    <button className={className} {...props}>
      {children}
    </button>
  );
});

// Mock formatMoney
jest.mock('../../../../util/currency', () => ({
  formatMoney: (intl, price) => `$${(price.amount / 100).toFixed(2)}`,
}));

// Mock createSlug
jest.mock('../../../../util/urlHelpers', () => ({
  createSlug: (title) => title.toLowerCase().replace(/\s+/g, '-'),
}));

const mockConfig = {
  stripe: {
    publishableKey: 'pk_test_key',
  },
  categoryConfiguration: {
    categories: [],
  },
};

const createMockProduct = (id, title, price, brand = 'Test Brand') => ({
  id: new UUID(id),
  type: 'listing',
  attributes: {
    title,
    price: { amount: price, currency: 'USD' },
    images: [
      {
        id: new UUID(`image-${id}`),
        type: 'image',
        attributes: {
          variants: {
            'listing-card': { url: 'http://example.com/image.jpg' },
          },
        },
      },
    ],
    publicData: {
      brand,
      categoryLevel1: 'baby-clothing',
    },
  },
});

// Create a mock reducer for testing
const mockReducer = (state = {}, action) => state;

const renderHeroSection = (initialState = {}) => {
  const defaultState = {
    heroProducts: {
      heroProducts: [],
      fetchHeroProductsInProgress: false,
      fetchHeroProductsError: null,
    },
    ...initialState,
  };

  const store = createStore(() => defaultState);

  // Mock the onFetchHeroProducts function
  const mockFetch = jest.fn();
  store.dispatch = jest.fn();

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <IntlProvider locale="en" messages={{}}>
            <ConfigurationProvider value={mockConfig}>
              <HeroSection />
            </ConfigurationProvider>
          </IntlProvider>
        </MemoryRouter>
      </Provider>
    ),
    mockFetch,
    store,
  };
};

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    renderHeroSection({
      heroProducts: {
        heroProducts: [],
        fetchHeroProductsInProgress: true,
        fetchHeroProductsError: null,
      },
    });

    expect(screen.getByText('Loading featured products...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    renderHeroSection({
      heroProducts: {
        heroProducts: [],
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: new Error('API Error'),
      },
    });

    expect(screen.getByText('Unable to load featured products')).toBeInTheDocument();
  });

  it('renders nothing when no products and no loading/error', () => {
    const { container } = renderHeroSection({
      heroProducts: {
        heroProducts: [],
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    expect(container.firstChild).toBeNull();
  });

  it('fetches hero products on mount', () => {
    const { store } = renderHeroSection();

    // The component should dispatch the fetchHeroProducts action on mount
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('renders hero section with products correctly', () => {
    const mockProducts = [
      createMockProduct('product1', 'Cotton Romper', 2899, 'EcoBaby'),
      createMockProduct('product2', 'Kurta Set', 4299, 'IndiaKids'),
      createMockProduct('product3', 'Baby Essentials', 2299, 'Artisan Co'),
    ];

    renderHeroSection({
      heroProducts: {
        heroProducts: mockProducts,
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    // Check main content is present
    expect(screen.getByText('Sustainable Baby Fashion with Indian Design Heritage')).toBeInTheDocument();
    expect(screen.getByText('Discover premium organic baby clothes from innovative designers in India. GOTS certified quality, traditional craftsmanship, delivered worldwide.')).toBeInTheDocument();

    // Check trust badges
    expect(screen.getByText('GOTS Certified')).toBeInTheDocument();
    expect(screen.getByText('Baby Safe')).toBeInTheDocument();
    expect(screen.getByText('Made in India')).toBeInTheDocument();

    // Check first product is displayed
    expect(screen.getByText('Cotton Romper')).toBeInTheDocument();
    expect(screen.getByText('$28.99')).toBeInTheDocument();
    expect(screen.getByText('EcoBaby')).toBeInTheDocument();

    // Check navigation dots (should be 3 for 3 products)
    const dots = screen.getAllByRole('button', { name: /View product \d+/ });
    expect(dots).toHaveLength(3);

    // Check product image
    expect(screen.getByTestId('responsive-image')).toBeInTheDocument();
    expect(screen.getByAltText('Cotton Romper')).toBeInTheDocument();

    // Check CTA links
    const searchPageLinks = screen.getAllByTestId('link-SearchPage');
    expect(searchPageLinks.length).toBeGreaterThan(0);
    expect(screen.getByTestId('link-CategoriesPage')).toBeInTheDocument();
  });

  it('handles product navigation correctly', async () => {
    const mockProducts = [
      createMockProduct('product1', 'Cotton Romper', 2899, 'EcoBaby'),
      createMockProduct('product2', 'Kurta Set', 4299, 'IndiaKids'),
      createMockProduct('product3', 'Baby Essentials', 2299, 'Artisan Co'),
    ];

    renderHeroSection({
      heroProducts: {
        heroProducts: mockProducts,
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    // Initially should show first product
    expect(screen.getByText('Cotton Romper')).toBeInTheDocument();
    expect(screen.getByText('$28.99')).toBeInTheDocument();

    // Click second navigation dot
    const secondDot = screen.getByRole('button', { name: 'View product 2' });
    await userEvent.click(secondDot);

    // Should now show second product
    await waitFor(() => {
      expect(screen.getByText('Kurta Set')).toBeInTheDocument();
      expect(screen.getByText('$42.99')).toBeInTheDocument();
      expect(screen.getByText('IndiaKids')).toBeInTheDocument();
    });
  });

  it('renders product link correctly', () => {
    const mockProducts = [
      createMockProduct('product1', 'Cotton Romper', 2899, 'EcoBaby'),
    ];

    renderHeroSection({
      heroProducts: {
        heroProducts: mockProducts,
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    const productLink = screen.getByTestId('link-ListingPage');
    expect(productLink).toBeInTheDocument();

    const linkParams = JSON.parse(productLink.getAttribute('data-params'));
    expect(linkParams.id).toBe('product1');
    expect(linkParams.slug).toBe('cotton-romper');
  });

  it('handles product without image gracefully', () => {
    const productWithoutImage = {
      id: new UUID('product1'),
      type: 'listing',
      attributes: {
        title: 'No Image Product',
        price: { amount: 1999, currency: 'USD' },
        images: [],
        publicData: {
          brand: 'Test Brand',
          categoryLevel1: 'baby-clothing',
        },
      },
    };

    renderHeroSection({
      heroProducts: {
        heroProducts: [productWithoutImage],
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    expect(screen.getByText('No Image Product')).toBeInTheDocument();
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });

  it('handles product without brand gracefully', () => {
    const productWithoutBrand = {
      id: new UUID('product1'),
      type: 'listing',
      attributes: {
        title: 'No Brand Product',
        price: { amount: 1999, currency: 'USD' },
        images: [],
        publicData: {
          categoryLevel1: 'baby-clothing',
        },
      },
    };

    renderHeroSection({
      heroProducts: {
        heroProducts: [productWithoutBrand],
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    expect(screen.getByText('No Brand Product')).toBeInTheDocument();
    expect(screen.getByText('Handcrafted')).toBeInTheDocument(); // Fallback badge
  });

  it('handles product without price gracefully', () => {
    const productWithoutPrice = {
      id: new UUID('product1'),
      type: 'listing',
      attributes: {
        title: 'No Price Product',
        images: [],
        publicData: {
          brand: 'Test Brand',
          categoryLevel1: 'baby-clothing',
        },
      },
    };

    renderHeroSection({
      heroProducts: {
        heroProducts: [productWithoutPrice],
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    expect(screen.getByText('No Price Product')).toBeInTheDocument();
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    // Price element should not be rendered
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('renders quick navigation correctly', () => {
    const mockProducts = [createMockProduct('product1', 'Test Product', 1999)];

    renderHeroSection({
      heroProducts: {
        heroProducts: mockProducts,
        fetchHeroProductsInProgress: false,
        fetchHeroProductsError: null,
      },
    });

    // Check quick nav items
    expect(screen.getByText('Baby (0-24m)')).toBeInTheDocument();
    expect(screen.getByText('Toddler (2-5y)')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
    expect(screen.getByText('Accessories')).toBeInTheDocument();

    // Check quick nav links
    const quickNavLinks = screen.getAllByTestId('link-SearchPage');
    expect(quickNavLinks.length).toBeGreaterThan(1); // Main CTA + quick nav links
  });
});