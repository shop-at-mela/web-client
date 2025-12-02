import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../../context/routeConfigurationContext';
import FeaturedBrandPartners from './FeaturedBrandPartners';

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
      price: { amount: 1200, currency: 'INR' },
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
];

const mockMessages = {
  'FeaturedBrandPartners.title': 'Trusted by Parents, Verified by Us',
  'FeaturedBrandPartners.subtitle':
    'Discover premium brands that meet our strict quality and safety standards',
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
  'PartnerCTACard.title': 'Become a Partner',
  'PartnerCTACard.description': 'Join our network of trusted brands.',
  'PartnerCTACard.cta': 'Apply Now',
};

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={mockConfig}>
        <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
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
      screen.getByText('Discover premium brands that meet our strict quality and safety standards')
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

  it('renders PartnerCTACard', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Become a Partner')).toBeInTheDocument();
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
  });

  it('limits display to 6 brands maximum', () => {
    const sevenBrands = [
      ...mockBrandsWithProducts,
      { brand: { ...mockBrand1, id: { uuid: 'brand-3' } }, products: [] },
      { brand: { ...mockBrand1, id: { uuid: 'brand-4' } }, products: [] },
      { brand: { ...mockBrand1, id: { uuid: 'brand-5' } }, products: [] },
      { brand: { ...mockBrand1, id: { uuid: 'brand-6' } }, products: [] },
      { brand: { ...mockBrand1, id: { uuid: 'brand-7' } }, products: [] },
    ];

    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={sevenBrands} />
      </TestWrapper>
    );

    // Count BrandCardHome components (should be 6, not 7)
    // Plus 1 PartnerCTACard = 7 total grid items
    const grid = container.querySelector('.grid');
    expect(grid.children.length).toBe(7); // 6 brands + 1 partner card
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

    expect(screen.getByText('Explore All 2 Brands')).toBeInTheDocument();

    const viewAllLink = screen.getByText('Explore All 2 Brands').closest('a');
    expect(viewAllLink).toBeInTheDocument();
  });

  it('renders grid container', () => {
    const { container } = render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('passes correct partnerUrl to PartnerCTACard', () => {
    render(
      <TestWrapper>
        <FeaturedBrandPartners brandsWithProducts={mockBrandsWithProducts} />
      </TestWrapper>
    );

    const partnerLink = screen.getByText('Apply Now').closest('a');
    expect(partnerLink).toHaveAttribute('href', '/partner');
  });
});
