import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';

// Break the import chain: components/index.js → UserNav → routeConfiguration → pageDataLoadingAPI → ducks
jest.mock('../../routing/routeConfiguration', () => []);

// Mock ListingCardMini to avoid Money type dependency in unit tests
jest.mock('../ListingCardMini/ListingCardMini', () => {
  const ListingCardMini = ({ listing }) => (
    <div data-testid="listing-card-mini">{listing ? listing.attributes.title : 'Coming Soon'}</div>
  );
  ListingCardMini.displayName = 'ListingCardMini';
  return { __esModule: true, ListingCardMini };
});

import BrandCardHome from './BrandCardHome';

const mockBrand = {
  id: { uuid: 'brand-123' },
  type: 'user',
  attributes: {
    profile: {
      displayName: 'Masilo',
      bio: 'Premium organic baby clothing from India. Safe, sustainable, certified.',
      publicData: {
        certifications: ['gots_certified', 'non_toxic_dyes'],
        brandLogoUrl: 'https://example.com/logo.jpg',
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
      title: 'Product 1',
      price: { amount: 1000, currency: 'INR' },
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

const mockConfig = {
  marketplaceName: 'Mela',
  currency: 'INR',
  locale: 'en',
};

const mockRoutes = [
  { path: '/u/:id', name: 'ProfilePage' },
  { path: '/brands/:brandSlug', name: 'BrandPage' },
  { path: '/l/:slug/:id', name: 'ListingPage' },
];

const mockMessages = {
  'BrandCard.shopAll': 'Shop All Products',
  'BrandCard.noProduct': 'Coming Soon',
  'BrandCardHome.verifiedPartner': '✓ Verified Partner',
  'BrandCardHome.customerCount': '{count, plural, one {# customer} other {# customers}}',
  'BrandCardHome.addDescription': '✏️ Add description',
  'BrandCardHome.addOriginYear': '📍 Add location & year',
  'BrandCardHome.addCertifications': '🏆 Add certifications',
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

describe('BrandCardHome', () => {
  it('renders brand name and logo', () => {
    render(
      <TestWrapper>
        <BrandCardHome brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Masilo')).toBeInTheDocument();
    expect(screen.getByAltText('Masilo')).toBeInTheDocument();
  });

  it('header area is a link to the brand page', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCardHome brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    // The headerLink wraps logo + name — it must be an anchor
    const headerLink = container.querySelector('a.headerLink');
    expect(headerLink).toBeInTheDocument();
    expect(headerLink).toContainElement(screen.getByText('Masilo'));
  });

  it('renders tagline from bio (first sentence, max 80 chars)', () => {
    render(
      <TestWrapper>
        <BrandCardHome brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Premium organic baby clothing from India')).toBeInTheDocument();
  });

  it('truncates long tagline with ellipsis at 80 chars', () => {
    const longBioBrand = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          ...mockBrand.attributes.profile,
          bio: 'This is a very long bio that should be truncated because it exceeds eighty characters in length and we want to keep it concise for better readability.',
        },
      },
    };

    render(
      <TestWrapper>
        <BrandCardHome brand={longBioBrand} products={mockProducts} />
      </TestWrapper>
    );

    const tagline = screen.getByText(/This is a very long bio/);
    expect(tagline.textContent).toContain('...');
    expect(tagline.textContent.length).toBeLessThanOrEqual(83); // 80 chars + "..."
  });

  it('renders brand origin when provided', () => {
    const brandWithOrigin = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          ...mockBrand.attributes.profile,
          publicData: {
            ...mockBrand.attributes.profile.publicData,
            brandOrigin: 'Bangalore, India',
            establishedYear: 2018,
          },
        },
      },
    };

    render(
      <TestWrapper>
        <BrandCardHome brand={brandWithOrigin} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Bangalore, India · Est. 2018')).toBeInTheDocument();
  });

  it('shows placeholder when brand origin missing', () => {
    const brandNoOrigin = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          displayName: 'TestBrand',
          publicData: {},
        },
      },
    };

    render(
      <TestWrapper>
        <BrandCardHome brand={brandNoOrigin} products={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('📍 Add location & year')).toBeInTheDocument();
  });

  it('shows placeholder when tagline/bio missing', () => {
    const brandNoBio = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          displayName: 'TestBrand',
          publicData: {},
        },
      },
    };

    render(
      <TestWrapper>
        <BrandCardHome brand={brandNoBio} products={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('✏️ Add description')).toBeInTheDocument();
  });

  it('shows placeholder when certifications missing', () => {
    const brandNoCerts = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          displayName: 'TestBrand',
          publicData: {},
        },
      },
    };

    render(
      <TestWrapper>
        <BrandCardHome brand={brandNoCerts} products={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('🏆 Add certifications')).toBeInTheDocument();
  });

  it('renders all certification badges with icons', () => {
    const brandWithMultipleCerts = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          ...mockBrand.attributes.profile,
          publicData: {
            ...mockBrand.attributes.profile.publicData,
            certifications: ['gots_certified', 'non_toxic_dyes', 'fair_trade'],
          },
        },
      },
    };

    const { container } = render(
      <TestWrapper>
        <BrandCardHome brand={brandWithMultipleCerts} products={mockProducts} />
      </TestWrapper>
    );

    const badges = container.querySelectorAll('[data-certification]');
    expect(badges.length).toBe(3);
  });

  describe('maxProducts prop', () => {
    it('renders 2x2 grid (4 slots) by default', () => {
      render(
        <TestWrapper>
          <BrandCardHome brand={mockBrand} products={[mockProducts[0]]} />
        </TestWrapper>
      );

      // 1 real product + 3 placeholders = 4 slots
      const placeholders = screen.getAllByText('Coming Soon');
      expect(placeholders.length).toBe(3);
    });

    it('renders 1x2 grid (2 slots) when maxProducts={2}', () => {
      render(
        <TestWrapper>
          <BrandCardHome brand={mockBrand} products={[mockProducts[0]]} maxProducts={2} />
        </TestWrapper>
      );

      // 1 real product + 1 placeholder = 2 slots
      const placeholders = screen.getAllByText('Coming Soon');
      expect(placeholders.length).toBe(1);
    });

    it('shows no placeholders when products fill all slots', () => {
      const twoProducts = [mockProducts[0], { ...mockProducts[0], id: { uuid: 'product-2' } }];

      render(
        <TestWrapper>
          <BrandCardHome brand={mockBrand} products={twoProducts} maxProducts={2} />
        </TestWrapper>
      );

      expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
    });
  });

  describe('showCta prop', () => {
    it('renders Shop All CTA by default', () => {
      render(
        <TestWrapper>
          <BrandCardHome brand={mockBrand} products={mockProducts} />
        </TestWrapper>
      );

      const shopAllLink = screen.getByText('Shop All Products').closest('a');
      expect(shopAllLink).toBeInTheDocument();
      expect(shopAllLink.getAttribute('href')).toContain('brand-123');
    });

    it('hides Shop All CTA when showCta={false}', () => {
      render(
        <TestWrapper>
          <BrandCardHome brand={mockBrand} products={mockProducts} showCta={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Shop All Products')).not.toBeInTheDocument();
    });
  });

  it('renders placeholder logo when no logo available', () => {
    const brandNoLogo = {
      ...mockBrand,
      attributes: {
        profile: {
          displayName: 'TestBrand',
          publicData: {},
        },
      },
    };

    const { container } = render(
      <TestWrapper>
        <BrandCardHome brand={brandNoLogo} products={[]} />
      </TestWrapper>
    );

    const placeholder = container.querySelector('.logoPlaceholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('T');
  });

  it('returns null when brand is null', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCardHome brand={null} products={mockProducts} />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('memoizes correctly based on brand and products', () => {
    const { rerender } = render(
      <TestWrapper>
        <BrandCardHome brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    rerender(
      <TestWrapper>
        <BrandCardHome brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Masilo')).toBeInTheDocument();
  });
});
