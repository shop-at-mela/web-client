import React, { useState } from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';
import configureStore from '../../store';
import BrandHeroCard, { pickHeroIndex } from './BrandHeroCard';

const SHARETRIBE_URL = 'https://sharetribe.imgix.net/hero-variant.jpg';
const SHOPIFY_URL_0 = 'https://cdn.shopify.com/hero-0.jpg';
const SHOPIFY_URL_1 = 'https://cdn.shopify.com/hero-1.jpg';

const makeBrand = publicData => ({
  id: { uuid: 'brand-hero-1' },
  type: 'user',
  attributes: {
    profile: {
      displayName: 'House of Chikankari',
      bio: 'Authentic Lucknow chikankari, made by the artisans behind the craft. More bio.',
      publicData,
    },
  },
  profileImage: null,
});

const mockConfig = {
  marketplaceName: 'Mela',
  currency: 'INR',
  locale: 'en',
};

const mockRoutes = [
  { path: '/u/:id', name: 'ProfilePage' },
  { path: '/brands/:brandSlug', name: 'BrandPage' },
];

const mockMessages = {
  'BrandHeroCard.madeInIndia': 'Made in India',
};

// Store is created once per TestWrapper instance (lazy useState initializer)
// so it stays referentially stable across re-renders — a fresh store object
// on every render was making react-redux/react-router treat the subtree as
// remounted rather than updated, which broke "one pick per mount" tests that
// rerender within the same render() call.
const TestWrapper = ({ children }) => {
  const [store] = useState(() => configureStore({}));
  return (
    <Provider store={store}>
      <MemoryRouter>
        <IntlProvider locale="en" messages={mockMessages}>
          <ConfigurationProvider value={mockConfig}>
            <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
          </ConfigurationProvider>
        </IntlProvider>
      </MemoryRouter>
    </Provider>
  );
};

const renderCard = (publicData, extraProps = {}) => {
  // `wrapper` so RTL re-applies the SAME TestWrapper element on rerender()
  // instead of the test constructing a brand-new <TestWrapper> each time.
  return render(<BrandHeroCard brand={makeBrand(publicData)} {...extraProps} />, {
    wrapper: TestWrapper,
  });
};

// The hero <img> is decorative (alt="" + aria-hidden); query it by class-free
// DOM lookup: it is the only img inside the card link when the logo chip has
// no logo source.
const getHeroImg = container => container.querySelector('a img');

describe('pickHeroIndex', () => {
  it('picks a random index across the parallel arrays', () => {
    const ids = ['id-0', 'id-1', 'id-2'];
    const urls = ['url-0', 'url-1', 'url-2'];
    expect(pickHeroIndex(ids, urls, () => 0)).toBe(0);
    expect(pickHeroIndex(ids, urls, () => 0.5)).toBe(1);
    expect(pickHeroIndex(ids, urls, () => 0.99)).toBe(2);
  });

  it('covers indexes where only one array has a value (guarded by index)', () => {
    // ids shorter than urls: index 2 is still a candidate via the URL
    expect(pickHeroIndex(['id-0'], ['url-0', null, 'url-2'], () => 0.99)).toBe(2);
    // ids only, no urls
    expect(pickHeroIndex(['id-0', 'id-1'], null, () => 0.99)).toBe(1);
  });

  it('skips indexes with no source in either array', () => {
    // index 1 is null in both arrays → never picked
    const ids = ['id-0', null];
    const urls = ['url-0', null];
    expect(pickHeroIndex(ids, urls, () => 0.99)).toBe(0);
  });

  it('returns -1 when both arrays are empty/absent/malformed', () => {
    expect(pickHeroIndex([], [], () => 0)).toBe(-1);
    expect(pickHeroIndex(null, undefined, () => 0)).toBe(-1);
    expect(pickHeroIndex('not-an-array', {}, () => 0)).toBe(-1);
  });
});

describe('BrandHeroCard', () => {
  it('resolves a Sharetribe image id to its variant URL (preferred source)', () => {
    const { container } = renderCard(
      {
        brandHeroImageIds: ['img-uuid-0'],
        brandHeroImageListingIds: ['listing-uuid-0'],
        brandHeroImages: [SHOPIFY_URL_0],
      },
      { heroImageUrlById: { 'img-uuid-0': SHARETRIBE_URL } }
    );

    expect(getHeroImg(container)).toHaveAttribute('src', SHARETRIBE_URL);
    expect(screen.getByText('House of Chikankari')).toBeInTheDocument();
  });

  it('falls back to the Shopify URL at the same index when the id is unresolved', () => {
    const { container } = renderCard(
      {
        brandHeroImageIds: ['img-uuid-0'],
        brandHeroImageListingIds: ['listing-uuid-0'],
        brandHeroImages: [SHOPIFY_URL_0],
      },
      { heroImageUrlById: {} } // listing fetch failed / id missing from entities
    );

    expect(getHeroImg(container)).toHaveAttribute('src', SHOPIFY_URL_0);
  });

  it('falls back to the Shopify URL when the Sharetribe URL fails at runtime (img onError)', () => {
    const { container } = renderCard(
      {
        brandHeroImageIds: ['img-uuid-0'],
        brandHeroImages: [SHOPIFY_URL_0],
      },
      { heroImageUrlById: { 'img-uuid-0': SHARETRIBE_URL } }
    );

    const img = getHeroImg(container);
    expect(img).toHaveAttribute('src', SHARETRIBE_URL);

    fireEvent.error(img);

    expect(getHeroImg(container)).toHaveAttribute('src', SHOPIFY_URL_0);
  });

  it('renders the manual-entry case: Shopify URL with no Sharetribe id at that index', () => {
    const { container } = renderCard({
      brandHeroImages: [SHOPIFY_URL_0, SHOPIFY_URL_1],
    });

    const src = getHeroImg(container).getAttribute('src');
    expect([SHOPIFY_URL_0, SHOPIFY_URL_1]).toContain(src);
  });

  it('renders null when the brand has no hero source at all (no logo fallback)', () => {
    const { container } = renderCard({
      brandLogoUrl: 'https://example.com/logo.jpg', // logo alone is NOT a hero source
      brandHeroImageIds: [],
      brandHeroImages: [],
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders null when hero fields are absent entirely', () => {
    const { container } = renderCard({});
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the picked index stable across re-renders (one pick per mount)', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    try {
      const { container, rerender } = renderCard({
        brandHeroImages: [SHOPIFY_URL_0, SHOPIFY_URL_1],
      });
      const firstSrc = getHeroImg(container).getAttribute('src');
      const callsAfterMount = randomSpy.mock.calls.length;

      // Bare element — RTL's `wrapper: TestWrapper` (passed at the original
      // render() call) is re-applied automatically, so this updates the same
      // component instance instead of constructing a new wrapper subtree.
      rerender(
        <BrandHeroCard
          brand={makeBrand({ brandHeroImages: [SHOPIFY_URL_0, SHOPIFY_URL_1] })}
          className="rerendered"
        />
      );

      expect(getHeroImg(container).getAttribute('src')).toBe(firstSrc);
      expect(randomSpy.mock.calls.length).toBe(callsAfterMount);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('renders the place dateline from publicData brandCity, falling back to Made in India', () => {
    renderCard({
      brandHeroImages: [SHOPIFY_URL_0],
      brandCity: 'Lucknow',
    });
    expect(screen.getByText('Lucknow, India')).toBeInTheDocument();
  });

  it('renders Made in India when no location data exists', () => {
    renderCard({ brandHeroImages: [SHOPIFY_URL_0] });
    expect(screen.getByText('Made in India')).toBeInTheDocument();
  });

  it('renders the tagline from the first sentence of bio', () => {
    renderCard({ brandHeroImages: [SHOPIFY_URL_0] });
    expect(
      screen.getByText('Authentic Lucknow chikankari, made by the artisans behind the craft')
    ).toBeInTheDocument();
  });

  it('links the whole card to the brand page', () => {
    const { container } = renderCard({ brandHeroImages: [SHOPIFY_URL_0] });
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    // Brand id is not in configBrands → falls back to ProfilePage route
    expect(link.getAttribute('href')).toContain('/u/brand-hero-1');
  });
});
