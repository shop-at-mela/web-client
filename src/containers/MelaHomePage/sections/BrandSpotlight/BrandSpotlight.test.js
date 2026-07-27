import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../../context/routeConfigurationContext';

jest.mock('../../../../routing/routeConfiguration', () => []);

jest.mock('../../../../config/configBrands', () => ({
  getWeeklyFlagshipBrandId: jest.fn(),
  getBrandSlugById: jest.fn(() => 'fizzy-goblet'),
  getFeaturedProductIds: jest.fn(() => []),
}));

jest.mock('../../../../util/homepageSdk', () => ({
  users: { show: jest.fn() },
  listings: { query: jest.fn() },
}));

jest.mock('../../../../components/RedirectTrustSheet/RedirectTrustSheet', () => {
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

jest.mock('../../../../util/analytics/brandClickout', () => ({ openBrandStorefront: jest.fn() }));
jest.mock('../../../../util/sentimentCapture', () => ({
  shouldShowRedirectTrust: jest.fn(() => true),
  markRedirectTrustShown: jest.fn(),
}));
jest.mock('../../../../util/analytics/homepageEditorial', () => ({
  pushSpotlightView: jest.fn(),
  pushSpotlightBrandClick: jest.fn(),
  pushSpotlightStoreClick: jest.fn(),
}));

import BrandSpotlight from './BrandSpotlight';
import {
  getWeeklyFlagshipBrandId,
  getBrandSlugById,
  getFeaturedProductIds,
} from '../../../../config/configBrands';
import sdk from '../../../../util/homepageSdk';
import { openBrandStorefront } from '../../../../util/analytics/brandClickout';
import { shouldShowRedirectTrust } from '../../../../util/sentimentCapture';
import { pushSpotlightStoreClick, pushSpotlightBrandClick } from '../../../../util/analytics/homepageEditorial';

const mockMessages = {
  'BrandSpotlight.overline': 'Our Brands, Worth Knowing',
  'BrandSpotlight.madeInIndia': 'Made in India',
  'BrandSpotlight.seeOnMela': 'See {brand} on Mela',
  'BrandSpotlight.visitStore': "Visit {brand}'s Store",
  'BrandSpotlight.rotationNote': 'A different vetted brand is featured each week',
};

const mockRoutes = [{ path: '/brands/:brandSlug', name: 'BrandPage' }];

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={{}}>
        <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

const brandResponse = ({ brandCraft, brandStoreUrl, brandHeroImages } = {}) => ({
  data: {
    data: {
      id: { uuid: 'brand-1' },
      type: 'user',
      attributes: {
        profile: {
          displayName: 'Fizzy Goblet',
          bio: 'Handcrafted juttis for the modern wardrobe. Every pair is stitched by hand.',
          publicData: { brandCraft, brandStoreUrl, brandHeroImages },
        },
      },
    },
  },
});

describe('BrandSpotlight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // `resetMocks: true` (package.json jest config) wipes jest.fn(impl) custom
    // implementations before every test, including ones set at jest.mock() factory
    // time — so every mock implementation must be (re-)installed here, not just once.
    getWeeklyFlagshipBrandId.mockReturnValue('brand-1');
    getBrandSlugById.mockReturnValue('fizzy-goblet');
    getFeaturedProductIds.mockReturnValue([]);
    shouldShowRedirectTrust.mockReturnValue(true);
    sdk.listings.query.mockResolvedValue({ data: { data: [], included: [] } });
  });

  it('renders nothing while loading or when no flagship brand resolves', () => {
    getWeeklyFlagshipBrandId.mockReturnValue(null);
    const { container } = render(
      <TestWrapper>
        <BrandSpotlight />
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the brand name, craft chip, and story sentence once loaded', async () => {
    sdk.users.show.mockResolvedValue(
      brandResponse({ brandCraft: 'juttis stitched by hand in Mumbai', brandHeroImages: ['https://example.com/hero.jpg'] })
    );

    render(
      <TestWrapper>
        <BrandSpotlight />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getByText('Fizzy Goblet')).toBeInTheDocument());
    expect(screen.getByText('✦ juttis stitched by hand in Mumbai')).toBeInTheDocument();
    expect(screen.getByText(/Every pair is stitched by hand/)).toBeInTheDocument();
    // The tagline sentence itself should not repeat as the story sentence.
    expect(screen.queryByText(/Handcrafted juttis for the modern wardrobe\./)).not.toBeInTheDocument();
  });

  it('omits the "Visit Store" CTA when brandStoreUrl is absent', async () => {
    sdk.users.show.mockResolvedValue(brandResponse({}));

    render(
      <TestWrapper>
        <BrandSpotlight />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getByText('Fizzy Goblet')).toBeInTheDocument());
    expect(screen.queryByText(/Visit Fizzy Goblet's Store/)).not.toBeInTheDocument();
    expect(screen.getByText(/See Fizzy Goblet on Mela/)).toBeInTheDocument();
  });

  it('opens the redirect trust sheet and fires spotlight_store_click on Visit Store', async () => {
    sdk.users.show.mockResolvedValue(brandResponse({ brandStoreUrl: 'https://fizzygoblet.com' }));

    render(
      <TestWrapper>
        <BrandSpotlight />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getByText('Fizzy Goblet')).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Visit Fizzy Goblet's Store/));

    expect(pushSpotlightStoreClick).toHaveBeenCalledWith('brand-1');
    expect(screen.getByTestId('redirect-trust-sheet')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Continue'));
    expect(openBrandStorefront).toHaveBeenCalledWith(
      'https://fizzygoblet.com',
      expect.objectContaining({ brandName: 'Fizzy Goblet' })
    );
  });

  it('fires spotlight_brand_click when the "See on Mela" link is clicked', async () => {
    sdk.users.show.mockResolvedValue(brandResponse({}));

    render(
      <TestWrapper>
        <BrandSpotlight />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getByText('Fizzy Goblet')).toBeInTheDocument());
    fireEvent.click(screen.getByText(/See Fizzy Goblet on Mela/));
    expect(pushSpotlightBrandClick).toHaveBeenCalledWith('brand-1');
  });

  it('renders nothing when the brand fetch fails', async () => {
    sdk.users.show.mockRejectedValue(new Error('not found'));

    const { container } = render(
      <TestWrapper>
        <BrandSpotlight />
      </TestWrapper>
    );

    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
