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

jest.mock('../../components/RedirectTrustSheet/RedirectTrustSheet', () => {
  return function MockRedirectTrustSheet({ isOpen, brandName, onContinue, productUrl }) {
    if (!isOpen) return null;
    return (
      <div data-testid="redirect-trust-sheet">
        {brandName}
        <button onClick={() => onContinue(productUrl)}>Continue</button>
      </div>
    );
  };
});

jest.mock('../../util/analytics/brandClickout', () => ({
  openBrandStorefront: jest.fn(),
}));

jest.mock('../../util/sentimentCapture', () => ({
  shouldShowRedirectTrust: jest.fn(() => true),
  markRedirectTrustShown: jest.fn(),
}));

import { openBrandStorefront } from '../../util/analytics/brandClickout';
import { shouldShowRedirectTrust } from '../../util/sentimentCapture';

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
  'BrandStorefront.aboutTab': 'About & Story',
  'BrandStorefront.curatedOrderNote': 'Curated order — hero products first, basics follow',
  'BrandStorefront.vettedBadge': 'Vetted by Mela',
  'BrandStorefront.madeInIndia': 'Made in India',
  'BrandStorefront.productsCount': '{count} products',
  'BrandStorefront.metaShipping': 'Ships to all 50 US states',
  'BrandStorefront.metaCards': 'US cards accepted',
  'BrandStorefront.readFullStory': 'Read the full story →',
  'BrandStorefront.craftLabel': 'The craft:',
  'BrandStorefront.browseProducts': 'Browse {count} Products ↓',
  'BrandStorefront.howMelaWorksLabel': 'How Mela works:',
  'BrandStorefront.redirectMicrocopy': "browse and save here. When you buy, checkout happens securely on the brand's own store.",
  'BrandStorefront.elsewhereTitle': 'Elsewhere',
  'BrandStorefront.brandWebsite': 'Brand website',
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
      expect(screen.getByText('About & Story')).toBeInTheDocument();
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

  // Skipped: the brandMission section was intentionally removed in commit
  // 51fd826fd ("brand story in the About tab now covers both story and
  // ethos in a single field") - not a regression.
  it.skip('renders brand mission when provided', () => {
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

    // Skipped: the mission placeholder was removed along with the
    // brandMission section in commit 51fd826fd - not a regression.
    it.skip('shows mission placeholder when owner views profile without mission', () => {
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

  describe('Hero band (P1.1)', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    const flagshipBrand = {
      id: { uuid: '6a170717-31bf-4e1e-998f-f613e05fd9c1' },
      type: 'user',
      attributes: {
        profile: {
          displayName: 'Fizzy Goblet',
          bio: 'Handcrafted juttis, kolhapuris, and mules for the modern wardrobe.',
          publicData: {
            certifications: ['gots_certified'],
            brandLogoUrl: 'https://example.com/fizzy-goblet-logo.jpg',
            brandCity: 'Mumbai',
            brandCountry: 'India',
            brandStoreUrl: 'https://global.fizzygoblet.com',
            brandHeroImages: ['https://example.com/fizzy-goblet-hero.jpg'],
            brandStory:
              'Fizzy Goblet brings handcrafted footwear to the modern wardrobe.\n\nEvery pair is stitched by hand.',
            brandCraft: 'juttis and kolhapuris stitched by hand in Mumbai',
            melaVetted: true,
          },
        },
      },
      profileImage: null,
    };

    // 14 of 19 brands have only a logo + one-liner today — the hero band must
    // still render without any broken/empty modules for them.
    const sparseBrand = {
      id: { uuid: 'sparse-brand-id' },
      type: 'user',
      attributes: {
        profile: {
          displayName: 'Sparse Brand',
          bio: 'A brand with only the basics filled in.',
          publicData: {},
        },
      },
      profileImage: null,
    };

    it('renders full hero band for a flagship brand with complete data', () => {
      render(
        <TestWrapper>
          <BrandStorefront user={flagshipBrand} listings={mockListings} />
        </TestWrapper>
      );

      expect(screen.getByText('Vetted by Mela')).toBeInTheDocument();
      expect(screen.getByText(/The craft:/)).toBeInTheDocument();
      expect(screen.getByText(/juttis and kolhapuris/)).toBeInTheDocument();
      expect(screen.getByText(/Read the full story/)).toBeInTheDocument();
      // No outbound store link above the grid (decision 2026-07-26) — only an
      // on-Mela "Browse Products" CTA lives in the hero band.
      expect(screen.queryByText(/Visit .*'s Store/)).not.toBeInTheDocument();
      expect(screen.getByText(/Browse \d+ Products/)).toBeInTheDocument();
      // Both the banner and the logo chip use the brand name as alt text.
      const brandImages = screen.getAllByAltText('Fizzy Goblet');
      expect(brandImages.some(img => img.getAttribute('src') === 'https://example.com/fizzy-goblet-hero.jpg')).toBe(
        true
      );
    });

    it('degrades gracefully for a sparse brand (logo + one-liner only)', () => {
      const { container } = render(
        <TestWrapper>
          <BrandStorefront user={sparseBrand} listings={[]} />
        </TestWrapper>
      );

      // No broken <img> for the missing hero image — falls back to a gradient div.
      expect(container.querySelector('.heroImg')).not.toBeInTheDocument();
      expect(screen.queryByText('Vetted by Mela')).not.toBeInTheDocument();
      expect(screen.queryByText(/The craft:/)).not.toBeInTheDocument();
      // No listings and no store URL — no dead/disabled outbound link anywhere.
      expect(screen.queryByText(/Visit .*'s Store/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Brand website/)).not.toBeInTheDocument();
    });

    it('does not show the vetted pill when melaVetted is not explicitly true', () => {
      const unvettedBrand = {
        ...flagshipBrand,
        attributes: {
          ...flagshipBrand.attributes,
          profile: {
            ...flagshipBrand.attributes.profile,
            publicData: { ...flagshipBrand.attributes.profile.publicData, melaVetted: false },
          },
        },
      };

      render(
        <TestWrapper>
          <BrandStorefront user={unvettedBrand} listings={mockListings} />
        </TestWrapper>
      );

      expect(screen.queryByText('Vetted by Mela')).not.toBeInTheDocument();
    });

    // The outbound trigger now lives only in the About & Story tab (decision
    // 2026-07-26) — a plain "Brand website" link, not a hero-band CTA. It still
    // routes through the same shouldShowRedirectTrust/RedirectTrustSheet/
    // openBrandStorefront flow as before; only its location in the page changed.
    it('opens the redirect trust sheet on the About-tab brand-website click and forwards the click to openBrandStorefront', () => {
      shouldShowRedirectTrust.mockReturnValue(true);

      render(
        <TestWrapper>
          <BrandStorefront user={flagshipBrand} listings={mockListings} variant="about" />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Brand website'));

      expect(screen.getByTestId('redirect-trust-sheet')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Continue'));

      expect(openBrandStorefront).toHaveBeenCalledWith(
        'https://global.fizzygoblet.com',
        expect.objectContaining({ brandName: 'Fizzy Goblet' })
      );
    });

    it('redirects immediately without the trust sheet on repeat-session clicks', () => {
      shouldShowRedirectTrust.mockReturnValue(false);

      render(
        <TestWrapper>
          <BrandStorefront user={flagshipBrand} listings={mockListings} variant="about" />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Brand website'));

      expect(screen.queryByTestId('redirect-trust-sheet')).not.toBeInTheDocument();
      expect(openBrandStorefront).toHaveBeenCalledWith(
        'https://global.fizzygoblet.com',
        expect.objectContaining({ brandName: 'Fizzy Goblet' })
      );
    });

    it('does not render a primary CTA in the hero band even when brandStoreUrl is present', () => {
      render(
        <TestWrapper>
          <BrandStorefront user={flagshipBrand} listings={mockListings} />
        </TestWrapper>
      );

      // hasListings is true here, so Browse Products renders — but as the sole
      // hero CTA, never alongside an outbound button.
      expect(screen.getByText(/Browse \d+ Products/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Visit/ })).not.toBeInTheDocument();
    });

    it('excludes $0 promo SKUs from the grid and product counts', () => {
      const listingsWithFreeSku = [
        ...mockListings,
        {
          id: { uuid: 'free-promo-sku' },
          type: 'listing',
          attributes: {
            title: 'Limited Edition FREE Bag',
            price: { amount: 0, currency: 'INR' },
          },
          images: [],
        },
      ];

      render(
        <TestWrapper>
          <BrandStorefront user={mockBrand} listings={listingsWithFreeSku} />
        </TestWrapper>
      );

      expect(screen.queryByText('Limited Edition FREE Bag')).not.toBeInTheDocument();
      expect(screen.getByText('Products (2)')).toBeInTheDocument();
    });
  });
});
