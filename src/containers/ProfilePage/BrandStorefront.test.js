import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';

// Break the import chain: components/index.js → UserNav → routeConfiguration → pageDataLoadingAPI → ducks
jest.mock('../../routing/routeConfiguration', () => []);

import BrandStorefront from './BrandStorefront';

// Mock specific components to avoid complex configuration dependencies
jest.mock('../../components/ListingCard/ListingCard', () => {
  return function MockListingCard({ listing }) {
    return <div data-testid="listing-card">{listing.attributes.title}</div>;
  };
});

const mockBrand = {
  id: { uuid: '68ebd6d5-ffce-4cb9-9605-3b69f2b67152' },
  type: 'user',
  attributes: {
    profile: {
      displayName: 'Masilo',
      bio: 'Premium organic baby clothing from India. Safe, sustainable, certified. We work with artisan families in Maharashtra to bring you the finest handcrafted baby products.',
      publicData: {
        certifications: ['gots_certified', 'non_toxic_dyes'],
        brandLogoUrl: 'https://example.com/masilo-logo.jpg',
        brandOrigin: 'Bangalore, India',
        establishedYear: 2018,
        brandMission: 'To provide safe, sustainable, and beautiful baby products while supporting artisan communities.',
      },
    },
  },
  profileImage: null,
};

const mockListings = [
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
  {
    id: { uuid: 'product-2' },
    type: 'listing',
    attributes: {
      title: 'Bamboo Baby Blanket',
      price: { amount: 1500, currency: 'INR' },
    },
    images: [],
  },
];

const mockConfig = {
  marketplaceName: 'Mela',
  marketplaceRootURL: 'https://mela.com',
  currency: 'INR',
  locale: 'en',
  listing: {
    listingTypes: [
      {
        id: 'product-selling',
        transactionType: {
          process: 'default-purchase',
          alias: 'default-purchase/release-1',
          unitType: 'item',
        },
        listingFields: [],
      },
    ],
  },
};

const mockRoutes = [
  { path: '/u/:id', name: 'ProfilePage' },
  { path: '/u/:id/:variant', name: 'ProfilePageVariant' },
  { path: '/l/:slug/:id', name: 'ListingPage' },
  { path: '/account/profile', name: 'ProfileSettingsPage' },
];

const mockMessages = {
  'BrandStorefront.productsTab': 'Products ({count})',
  'BrandStorefront.aboutTab': 'About',
  'BrandStorefront.productsTitle': 'Products ({count})',
  'BrandStorefront.aboutTitle': 'About {name}',
  'BrandStorefront.ourStory': 'Our Story',
  'BrandStorefront.ourMission': 'Our Mission',
  'BrandStorefront.certifications': 'Certifications & Standards',
  'BrandStorefront.established': 'Est. {year}',
  'BrandStorefront.noProducts': 'No products available yet. Check back soon!',
  'BrandStorefront.readMore': 'Read More',
  'BrandStorefront.readLess': 'Read Less',
  'BrandStorefront.storyTip': 'Tip: Add {recommendedLength} characters for an engaging brand story. You have {currentLength} so far.',
  'ProfilePage.editProfileLinkDesktop': 'Edit Profile',
  'BrandStorefront.placeholder.logo.title': 'Add Your Brand Logo',
  'BrandStorefront.placeholder.logo.description': 'Upload a professional brand logo to build trust with customers.',
  'BrandStorefront.placeholder.tagline.title': 'Add a Brand Tagline',
  'BrandStorefront.placeholder.tagline.description': 'Write a compelling one-sentence description of what makes your brand unique.',
  'BrandStorefront.placeholder.origin.title': 'Add Brand Origin & Year',
  'BrandStorefront.placeholder.origin.description': 'Share where your brand is based and when you were established.',
  'BrandStorefront.placeholder.certifications.title': 'Add Certifications',
  'BrandStorefront.placeholder.certifications.description': 'Showcase your safety certifications (GOTS, BIS, etc.).',
  'BrandStorefront.placeholder.mission.title': 'Share Your Mission',
  'BrandStorefront.placeholder.mission.description': 'Tell customers about your brand purpose and values.',
  'BrandStorefront.placeholder.products.title': 'Add Your First Product',
  'BrandStorefront.placeholder.products.description': 'Create product listings to start selling on Mela.',
  'BrandStorefront.placeholder.cta': 'Complete Your Profile',
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

describe('BrandStorefront', () => {
  it('renders brand header with logo, name, and tagline', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Masilo')).toBeInTheDocument();
    expect(screen.getByText(/Premium organic baby clothing from India/)).toBeInTheDocument();
    expect(screen.getByAltText('Masilo')).toBeInTheDocument();
  });

  it('displays brand origin and established year', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Bangalore, India')).toBeInTheDocument();
    expect(screen.getByText('Est. 2018')).toBeInTheDocument();
  });

  it('renders certification badges in header', () => {
    const { container } = render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    const badges = container.querySelectorAll('[data-certification]');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders logo placeholder when no logo URL provided', () => {
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
        <BrandStorefront
          user={brandNoLogo}
          listings={[]}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    const placeholder = container.querySelector('.logoPlaceholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('T');
  });

  describe('Tab navigation', () => {
    it('shows only Products and About tabs (no Reviews tab)', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={mockBrand}
            listings={mockListings}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getAllByText(/Products/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.queryByText(/Reviews/)).not.toBeInTheDocument();
    });
  });

  it('renders products section with all listings', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Organic Cotton Onesie')).toBeInTheDocument();
    expect(screen.getByText('Bamboo Baby Blanket')).toBeInTheDocument();
  });

  it('shows empty state when no products available', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={[]}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('No products available yet. Check back soon!')).toBeInTheDocument();
  });

  it('renders About section with brand story', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          variant="about"
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Our Story')).toBeInTheDocument();
    expect(screen.getAllByText(/Premium organic baby clothing from India/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders brand mission when provided', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          variant="about"
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Our Mission')).toBeInTheDocument();
    expect(
      screen.getByText(/To provide safe, sustainable, and beautiful baby products/)
    ).toBeInTheDocument();
  });

  it('renders certifications detail section', () => {
    render(
      <TestWrapper>
        <BrandStorefront
          user={mockBrand}
          listings={mockListings}
          variant="about"
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Certifications & Standards')).toBeInTheDocument();
  });

  it('handles brand with foundedYear instead of establishedYear', () => {
    const brandWithFoundedYear = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          ...mockBrand.attributes.profile,
          publicData: {
            ...mockBrand.attributes.profile.publicData,
            foundedYear: 2019,
            establishedYear: undefined,
          },
        },
      },
    };

    render(
      <TestWrapper>
        <BrandStorefront
          user={brandWithFoundedYear}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Est. 2019')).toBeInTheDocument();
  });

  it('handles brand with separate brandCity and brandCountry', () => {
    const brandSeparateLocation = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          ...mockBrand.attributes.profile,
          publicData: {
            ...mockBrand.attributes.profile.publicData,
            brandOrigin: undefined,
            brandCity: 'Mumbai',
            brandCountry: 'India',
          },
        },
      },
    };

    render(
      <TestWrapper>
        <BrandStorefront
          user={brandSeparateLocation}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Mumbai, India')).toBeInTheDocument();
  });

  it('truncates long tagline to 120 characters', () => {
    const brandLongBio = {
      ...mockBrand,
      attributes: {
        ...mockBrand.attributes,
        profile: {
          ...mockBrand.attributes.profile,
          bio: 'This is a very long bio that exceeds one hundred and twenty characters and should be truncated with an ellipsis at the end to keep the header concise and readable for users viewing the brand storefront page.',
        },
      },
    };

    render(
      <TestWrapper>
        <BrandStorefront
          user={brandLongBio}
          listings={mockListings}
          userTypeRoles={{ provider: true, customer: false }}
        />
      </TestWrapper>
    );

    const tagline = screen.getByText(/This is a very long bio/);
    expect(tagline.textContent.length).toBeLessThanOrEqual(120);
  });

  describe('Placeholder components for brand owner', () => {
    const mockCurrentUser = {
      id: { uuid: '68ebd6d5-ffce-4cb9-9605-3b69f2b67152' },
      type: 'user',
    };

    const incompleteBrand = {
      id: { uuid: '68ebd6d5-ffce-4cb9-9605-3b69f2b67152' },
      type: 'user',
      attributes: {
        profile: {
          displayName: 'Incomplete Brand',
          bio: null,
          publicData: {},
        },
      },
      profileImage: null,
    };

    it('shows logo placeholder when owner views profile without logo', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Add Your Brand Logo')).toBeInTheDocument();
      expect(screen.getByText(/Upload a professional brand logo/)).toBeInTheDocument();
    });

    it('shows tagline placeholder when owner views profile without bio', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Add a Brand Tagline')).toBeInTheDocument();
    });

    it('shows origin placeholder when owner views profile without location/year', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Add Brand Origin & Year')).toBeInTheDocument();
    });

    it('shows certifications placeholder when owner views profile without certifications', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      const certPlaceholders = screen.getAllByText('Add Certifications');
      expect(certPlaceholders.length).toBeGreaterThanOrEqual(1);
    });

    it('shows products placeholder when owner views profile without products', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Add Your First Product')).toBeInTheDocument();
      expect(screen.getByText(/Create product listings to start selling/)).toBeInTheDocument();
    });

    it('shows mission placeholder when owner views profile without mission', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            variant="about"
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Share Your Mission')).toBeInTheDocument();
    });

    it('shows "Complete Your Profile" CTA in placeholders', () => {
      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={mockCurrentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      const ctaButtons = screen.getAllByText('Complete Your Profile');
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('does NOT show placeholders when non-owner views incomplete profile', () => {
      const differentUser = {
        id: { uuid: 'different-user-id' },
        type: 'user',
      };

      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={differentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Add Your Brand Logo')).not.toBeInTheDocument();
      expect(screen.queryByText('Add a Brand Tagline')).not.toBeInTheDocument();
      expect(screen.queryByText('Complete Your Profile')).not.toBeInTheDocument();
    });

    it('shows generic empty state (not placeholder) for products when non-owner views', () => {
      const differentUser = {
        id: { uuid: 'different-user-id' },
        type: 'user',
      };

      render(
        <TestWrapper>
          <BrandStorefront
            user={incompleteBrand}
            listings={[]}
            currentUser={differentUser}
            userTypeRoles={{ provider: true, customer: false }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('No products available yet. Check back soon!')).toBeInTheDocument();
      expect(screen.queryByText('Add Your First Product')).not.toBeInTheDocument();
    });
  });
});
