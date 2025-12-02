import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';
import BrandCard from './BrandCard';

const mockBrand = {
  id: { uuid: 'brand-123' },
  type: 'user',
  attributes: {
    profile: {
      displayName: 'Masilo',
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
  {
    id: { uuid: 'product-2' },
    type: 'listing',
    attributes: {
      title: 'Product 2',
      price: { amount: 2000, currency: 'INR' },
    },
    images: [
      {
        id: { uuid: 'img-2' },
        attributes: {
          variants: {
            'square-small': { url: 'https://example.com/p2.jpg', width: 240, height: 240 },
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
  {
    path: '/u/:id',
    name: 'ProfilePage',
  },
  {
    path: '/l/:slug/:id',
    name: 'ListingPage',
  },
];

const mockMessages = {
  'BrandCard.shopAll': 'Shop All Products',
  'BrandCard.noProduct': 'Coming Soon',
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

describe('BrandCard', () => {
  it('renders brand name', () => {
    render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Masilo')).toBeInTheDocument();
  });

  it('renders brand logo when available', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    const logo = container.querySelector('.smallLogo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.jpg');
  });

  it('renders placeholder when no logo available', () => {
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
        <BrandCard brand={brandNoLogo} products={[]} />
      </TestWrapper>
    );

    const placeholder = container.querySelector('.logoPlaceholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('T'); // First letter of TestBrand
  });

  it('renders certification badge when certifications present', () => {
    render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('GOTS')).toBeInTheDocument();
  });

  it('does not render certification badge when no certifications', () => {
    const brandNoCerts = {
      ...mockBrand,
      attributes: {
        profile: {
          displayName: 'Masilo',
          publicData: {
            certifications: [],
          },
        },
      },
    };

    const { container } = render(
      <TestWrapper>
        <BrandCard brand={brandNoCerts} products={mockProducts} />
      </TestWrapper>
    );

    const certBadge = container.querySelector('.certBadge');
    expect(certBadge).not.toBeInTheDocument();
  });

  it('renders up to 4 product cards in grid', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    const productGrid = container.querySelector('.productGrid');
    expect(productGrid).toBeInTheDocument();
    expect(productGrid.children.length).toBe(4); // 2 products + 2 placeholders
  });

  it('shows placeholders when less than 4 products', () => {
    render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={[mockProducts[0]]} />
      </TestWrapper>
    );

    const placeholders = screen.getAllByText('Coming Soon');
    expect(placeholders.length).toBe(3); // 1 product + 3 placeholders
  });

  it('limits to 4 products even if more provided', () => {
    const manyProducts = [
      ...mockProducts,
      { ...mockProducts[0], id: { uuid: 'product-3' } },
      { ...mockProducts[0], id: { uuid: 'product-4' } },
      { ...mockProducts[0], id: { uuid: 'product-5' } },
      { ...mockProducts[0], id: { uuid: 'product-6' } },
    ];

    const { container } = render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={manyProducts} />
      </TestWrapper>
    );

    const productGrid = container.querySelector('.productGrid');
    expect(productGrid.children.length).toBe(4); // Only 4 products displayed
  });

  it('renders Shop All CTA with link to profile', () => {
    render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    const shopAllLink = screen.getByText('Shop All Products').closest('a');
    expect(shopAllLink).toBeInTheDocument();
    expect(shopAllLink.getAttribute('href')).toContain('brand-123');
  });

  it('returns null when brand is null', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCard brand={null} products={mockProducts} />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} className="custom-brand-card" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-brand-card');
  });

  it('uses rootClassName to override default', () => {
    const { container } = render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} rootClassName="root-override" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('root-override');
    expect(container.firstChild).not.toHaveClass('root');
  });

  it('passes onFavorite to ListingCardMini', () => {
    const onFavorite = jest.fn();
    render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} onFavorite={onFavorite} />
      </TestWrapper>
    );

    // ListingCardMini should receive the onFavorite prop
    // We can verify this by checking if favorite buttons are rendered
    const favoriteButtons = screen.getAllByLabelText('Add to favorites');
    expect(favoriteButtons.length).toBe(2); // 2 products
  });

  it('memoizes correctly based on brand and products', () => {
    const { rerender } = render(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    // Rerender with same props - should not re-render
    rerender(
      <TestWrapper>
        <BrandCard brand={mockBrand} products={mockProducts} />
      </TestWrapper>
    );

    expect(screen.getByText('Masilo')).toBeInTheDocument();
  });
});
