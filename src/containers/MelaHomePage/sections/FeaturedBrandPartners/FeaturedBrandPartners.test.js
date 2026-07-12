import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('../../../../config/configBrands', () => ({
  getAllBrandIds: () => Array.from({ length: 12 }, (_, i) => `brand-uuid-${i}`),
  getBrandSlugById: () => null,
}));
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../../context/routeConfigurationContext';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import configureStore from '../../../../store';
import FeaturedBrandPartners from './FeaturedBrandPartners';

const { Money } = sdkTypes;

const mockBrand1 = {
  id: { uuid: '68ebd6d5-ffce-4cb9-9605-3b69f2b67152' },
  type: 'user',
  attributes: {
    profile: {
      displayName: 'Masilo',
      bio: 'Premium organic baby clothing from India. Safe, sustainable, certified.',
      publicData: {
        certifications: ['gots_certified'],
        brandLogoUrl: 'https://example.com/masilo-logo.jpg',
      },
    },
  },
  profileImage: null,
};

const mockBrand2 = {
  id: { uuid: '68e42d68-8838-48b5-8299-8e01f46280f2' },
  type: 'user',
  attributes: {
    profile: {
      displayName: 'Baby Forest',
      bio: 'Natural baby care products.',
      publicData: {
        certifications: [],
      },
    },
  },
  profileImage: null,
};

const mockProducts = [
  {
    id: { uuid: 'product-1' },
    type: 'listing',
    attributes: {
      title: 'Organic Cotton Onesie',
      price: new Money(1200, 'INR'),
    },
    images: [
      {
        id: { uuid: 'img-1' },
        attributes: {
          variants: {
            'square-small': { url: 'https://example.com/p1.jpg', width: 240, height: 240 },
          },
        },
      },
    ],
  },
];

const mockBrandsWithProducts = [
  {
    brand: mockBrand1,
    products: mockProducts,
  },
  {
    brand: mockBrand2,
    products: mockProducts,
  },
];

const mockConfig = {
  marketplaceName: 'Mela',
  currency: 'INR',
  locale: 'en',
};

const mockRoutes = [
  { path: '/u/:id', name: 'ProfilePage' },
  { path: '/l/:slug/:id', name: 'ListingPage' },
  { path: '/brands', name: 'BrandsPage' },
];

const mockMessages = {
  'FeaturedBrandPartners.title': 'Trusted by Parents, Verified by Us',
  'FeaturedBrandPartners.subtitle':
    'We vet every Indian brand so you don\'t have to — quality, safety, and cultural craft, all in one place.',
  'FeaturedBrandPartners.loading': 'Loading trusted brands...',
  'FeaturedBrandPartners.error': 'Unable to load brands. Please try again later.',
  'FeaturedBrandPartners.viewAllBrands': 'Explore All Brands',
  'FeaturedBrandPartners.viewAllBrandsCount': 'Explore All {count} Brands',
  'BrandCard.shopAll': 'Shop All Products',
  'BrandCard.noProduct': 'Coming Soon',
  'BrandCardHome.verifiedPartner': '✓ Verified Partner',
  'BrandCardHome.customerCount': '{count, plural, one {# customer} other {# customers}}',
  'BrandCardHome.addDescription': '✏️ Add description',
  'BrandCardHome.addOriginYear': '📍 Add location & year',
  'BrandCardHome.addCertifications': '🏆 Add certifications',
};

const TestWrapper = ({ children }) => (
  <Provider store={configureStore({})}>
    <MemoryRouter>
      <IntlProvider locale="en" messages={mockMessages}>
        <ConfigurationProvider value={mockConfig}>
          <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
        </ConfigurationProvider>
      </IntlProvider>
    </MemoryRouter>
  </Provider>
);

describe('FeaturedBrandPartners', () => {
  it('renders section title and subtitle', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Trusted by Parents, Verified by Us')).toBeInTheDocument();
    expect(
      screen.getByText(
        "We vet every Indian brand so you don't have to — quality, safety, and cultural craft, all in one place."
      )
    ).toBeInTheDocument();
  });

  it('renders BrandCardHome for each brand', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Masilo')).toBeInTheDocument();
    expect(screen.getByText('Baby Forest')).toBeInTheDocument();
  });

  it('renders all provided brands without a hard cap', () => {
    const manyBrands = Array.from({ length: 8 }, (_, i) => ({
      brand: { ...mockBrand1, id: { uuid: `brand-${i}` } },
      products: [],
    }));

    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={manyBrands} />
      </TestWrapper>
    );

    const carousel = container.querySelector('.carousel');
    expect(carousel.children.length).toBe(8);
  });

  it('shows loading state when fetchInProgress is true and no brands', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={[]} fetchInProgress={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading trusted brands...')).toBeInTheDocument();
  });

  it('does not show loading when brands are already loaded', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners
          brandsWithProducts={mockBrandsWithProducts}
          fetchInProgress={true}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Loading trusted brands...')).not.toBeInTheDocument();
    expect(screen.getByText('Masilo')).toBeInTheDocument();
  });

  it('shows error state when fetchError exists', () => {
    const mockError = { message: 'Network error' };

    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={[]} fetchError={mockError} />
      </TestWrapper>
    );

    expect(screen.getByText('Unable to load brands. Please try again later.')).toBeInTheDocument();
  });

  it('returns null when no brands and not loading', () => {
    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={[]} fetchInProgress={false} />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onFetchFeaturedBrands on mount when no brands loaded', () => {
    const mockFetch = jest.fn();

    render(
      <TestWrapper>
        <FeaturedBrandPartners
          brandsWithProducts={[]}
          onFetchFeaturedBrands={mockFetch}
          fetchInProgress={false}
        />
      </TestWrapper>
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not call onFetchFeaturedBrands when brands already loaded', () => {
    const mockFetch = jest.fn();

    render(
      <TestWrapper>
        <FeaturedBrandPartners
          brandsWithProducts={mockBrandsWithProducts}
          onFetchFeaturedBrands={mockFetch}
        />
      </TestWrapper>
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not call onFetchFeaturedBrands when already fetching', () => {
    const mockFetch = jest.fn();

    render(
      <TestWrapper>
        <FeaturedBrandPartners
          brandsWithProducts={[]}
          onFetchFeaturedBrands={mockFetch}
          fetchInProgress={true}
        />
      </TestWrapper>
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} className="custom" />
      </TestWrapper>
    );

    const root = container.querySelector('.root');
    expect(root).toHaveClass('custom');
  });

  it('applies custom rootClassName', () => {
    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners
          brandsWithProducts={mockBrandsWithProducts}
          rootClassName="customRoot"
        />
      </TestWrapper>
    );

    const root = container.querySelector('.customRoot');
    expect(root).toBeInTheDocument();
    expect(root).not.toHaveClass('root');
  });

  it('renders View All Brands CTA with brand count', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Explore All 12 Brands')).toBeInTheDocument();

    const viewAllLink = screen.getByText('Explore All 12 Brands').closest('a');
    expect(viewAllLink).toBeInTheDocument();
  });

  it('renders carousel container', () => {
    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    const carousel = container.querySelector('.carousel');
    expect(carousel).toBeInTheDocument();
  });
});
