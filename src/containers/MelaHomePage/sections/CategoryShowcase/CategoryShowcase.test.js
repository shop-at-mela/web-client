import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import { ConfigurationProvider } from '../../../../context/configurationContext';
import CategoryShowcase, { OccasionStrip, AgeNavigation, EXCLUDED_DISCOVERY_BRAND_SLUGS } from './CategoryShowcase';

// ── Module mocks ──────────────────────────────────────────────────────────────

// The SDK instance is created at module-level in CategoryShowcase.js via createInstance().
// Mock the loader so we control listings.query.
jest.mock('../../../../util/sdkLoader', () => ({
  createInstance: jest.fn(() => ({
    listings: { query: jest.fn() },
  })),
}));

// Mock data utils. Keep pickRandom real; stub normalisation helpers so tests
// don't need full JSON:API fixture data.
jest.mock('../../../../util/data', () => {
  const actual = jest.requireActual('../../../../util/data');
  return {
    ...actual,
    updatedEntities: jest.fn(entities => entities),
    denormalisedEntities: jest.fn(() => []),
  };
});

// Mock the components barrel — keeps tests free of deep rendering deps.
jest.mock('../../../../components', () => ({
  NamedLink: ({ children, name, to, className, params }) => (
    <a
      data-testid={`link-${name}`}
      data-params={JSON.stringify(params || {})}
      href={(to && to.search) || '#'}
      className={className}
    >
      {children}
    </a>
  ),
  ProductCarousel: ({ title, listings, isLoading }) =>
    isLoading ? (
      <div data-testid="carousel-loading" data-title={title}>{title}</div>
    ) : (
      <div data-testid="product-carousel" data-title={title} data-count={listings?.length ?? 0}>
        {title}
      </div>
    ),
  ListingCard: ({ listing, isBestseller }) => (
    <div
      data-testid="listing-card"
      data-id={listing?.id?.uuid}
      data-is-bestseller={String(!!isBestseller)}
    >
      {listing?.attributes?.title}
    </div>
  ),
}));

jest.mock('../../../../config/settings', () => ({
  sdk: {
    baseUrl: null,
    assetCdnBaseUrl: null,
    transitVerbose: false,
    clientId: 'test-client-id',
  },
  usingSSL: false,
}));

jest.mock('../../../../util/api', () => ({ typeHandlers: [] }));

// OccasionStrip now delegates each panel to the reusable OccasionCard, which imports
// NamedLink/ListingCard directly (bypassing the barrel mock above). Stub it with a
// lightweight stand-in that still emits the panel heading and one listing-card per
// product, so the OccasionStrip assertions (headings, listing-card counts) hold.
jest.mock('../../../../components/OccasionCard/OccasionCard', () => ({ label, isLoading, products = [] }) => (
  <div data-testid="occasion-card">
    <h4>{label}</h4>
    {isLoading
      ? [1, 2, 3, 4].map(i => <div key={i} className="productSkeleton" />)
      : products.map(p => (
          <div
            key={p.id.uuid}
            data-testid="listing-card"
            data-id={p.id.uuid}
            data-is-bestseller={String(!!p?.attributes?.publicData?.isBestseller)}
          >
            {p?.attributes?.title}
          </div>
        ))}
  </div>
));

// Fixed, small brand list so per-brand query-count assertions below are simple
// and don't depend on configBrands.js's env-specific (and possibly empty, in
// the test env's 'production' branch) allBrandIds. None map to an excluded
// slug, so CategoryShowcase.js's discovery-carousel exclusion filter is a
// no-op here — none of these 3 test IDs get filtered out.
const TEST_BRAND_IDS = ['brand-1', 'brand-2', 'brand-3'];
jest.mock('../../../../config/configBrands', () => ({
  allBrandIds: ['brand-1', 'brand-2', 'brand-3'],
  getBrandSlugById: id => ({ 'brand-1': 'slug-1', 'brand-2': 'slug-2', 'brand-3': 'slug-3' }[id]),
}));

// ── References to the mocked functions ───────────────────────────────────────

// createInstance() is called at CategoryShowcase.js module-load time (during the
// import above). Its first result is the SDK object we control.
import { createInstance } from '../../../../util/sdkLoader';
import { updatedEntities, denormalisedEntities } from '../../../../util/data';

// Capture the mock query reference ONCE at module-body time (after all imports
// have been processed and CategoryShowcase.js has already called createInstance).
// jest.clearAllMocks() clears createInstance.mock.results in each beforeEach,
// but this variable still holds a direct reference to the underlying jest.fn().
const mockQuery = createInstance.mock.results[0]?.value?.listings?.query;

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyQueryResponse = () => ({
  data: { data: [], included: [], meta: {} },
});

/**
 * Minimal listing.
 * occasionTag populates publicData.occasion for OccasionStrip's client-side filter.
 * isBestseller populates publicData.isBestseller for the badge.
 */
const makeListing = (id, { occasionTag = null, isBestseller = false } = {}) => ({
  id: { uuid: id },
  type: 'listing',
  attributes: {
    title: `Product ${id}`,
    price: { amount: 1500, currency: 'USD' },
    publicData: {
      ...(occasionTag ? { occasion: occasionTag } : {}),
      ...(isBestseller ? { isBestseller: true } : {}),
    },
  },
});

const renderInContext = (ui, config = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{}}>
        <ConfigurationProvider value={config}>{ui}</ConfigurationProvider>
      </IntlProvider>
    </MemoryRouter>
  );

// ── EXCLUDED_DISCOVERY_BRAND_SLUGS ─────────────────────────────────────────────
// Guards against a typo in the exclusion list silently no-opping it: each slug
// must resolve to a real, currently-configured brand UUID via the *real*
// configBrands.js (bypassing the file-level jest.mock above via requireActual),
// not the fixed 3-brand test mock used everywhere else in this file.

describe('EXCLUDED_DISCOVERY_BRAND_SLUGS', () => {
  it('every excluded slug resolves to a real brand UUID in configBrands.js', () => {
    // configBrands.js resolves brandConfigurations off REACT_APP_ENV at require
    // time; the test runner's .env sets REACT_APP_ENV=production, whose brand
    // bucket is intentionally empty (live brand data lives under .development —
    // see configBrands.js's brandConfigurationsByEnv). Force 'development' via
    // isolateModules so this checks against the actual populated brand list.
    const originalEnv = process.env.REACT_APP_ENV;
    process.env.REACT_APP_ENV = 'development';
    let getBrandIdBySlug;
    jest.isolateModules(() => {
      ({ getBrandIdBySlug } = jest.requireActual('../../../../config/configBrands'));
    });
    process.env.REACT_APP_ENV = originalEnv;

    EXCLUDED_DISCOVERY_BRAND_SLUGS.forEach(slug => {
      expect(getBrandIdBySlug(slug)).toEqual(expect.any(String));
    });
  });
});

// ── CategoryShowcase (default export) ─────────────────────────────────────────

describe('CategoryShowcase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
  });

  it('renders the section heading', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.getByText('Discover Indian Design')).toBeInTheDocument();
  });

  it('renders Browse All Categories link', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.getByText(/Browse All Categories/i)).toBeInTheDocument();
  });

  // P1.3: "Shop Baby by Age" moved to the Baby & Kids category page (CategoryPage.js)
  // and "Shop by Occasion" moved up to its own top-level homepage section
  // (MelaHomePage.js) — neither renders as part of CategoryShowcase anymore, though
  // both components are still exported from this file for reuse (see their own
  // describe blocks below).
  it('does not render Shop Baby by Age (relocated to the category page)', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.queryByText('Shop Baby by Age')).not.toBeInTheDocument();
  });

  it('does not render Shop by Occasion (relocated to its own homepage section)', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.queryByText('Shop by Occasion')).not.toBeInTheDocument();
  });
});

/**
 * Helper: render the component, wait for all carousels to finish loading
 * (i.e. transition from carousel-loading → product-carousel), then return
 * the accumulated SDK call list. This avoids timing issues where waitFor()
 * polls before all async effects have flushed.
 */
const renderAndWaitForLoad = async (ui, config = {}) => {
  // Provide at least 2 items so ProductCarousel doesn't hide on minItems check.
  if (!denormalisedEntities.mock.calls.length) {
    denormalisedEntities.mockReturnValue([makeListing('a'), makeListing('b')]);
  }
  renderInContext(ui, config);
  // findAllByTestId waits up to 1000ms for carousels to leave loading state.
  await screen.findAllByTestId('product-carousel');
  return mockQuery.mock.calls;
};

// ── AllCategoryCarousels ──────────────────────────────────────────────────────
// P1.3: only 2 surviving top-level categories (Fashion, Baby & Kids) fetched by a
// single carousel component using ALL_CATEGORIES (down from 6 — Home & Kitchen,
// Jewelry & Accessories, Beauty & Wellness, and Art & Craft are cut from the
// homepage, still reachable via /categories). Each category is fetched via
// fetchListingsAcrossBrands — one small query per configured brand (author_id +
// perPage: PER_BRAND_COUNT), merged client-side — see util/bestsellerCarousel.js.
// TEST_BRAND_IDS has 3 brands, so every category yields 3 queries.

describe('AllCategoryCarousels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
  });

  it('queries every configured brand for both surviving categories', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    const catCalls = calls.filter(([p]) => p.pub_categoryLevel1);
    expect(catCalls).toHaveLength(TEST_BRAND_IDS.length * 2); // 3 brands × 2 categories
    catCalls.forEach(([params]) => {
      expect(TEST_BRAND_IDS).toContain(params.author_id);
      expect(params.perPage).toBe(2);
    });
  });

  it('queries only Fashion and Baby-Kids', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    const categories = calls.filter(([p]) => p.pub_categoryLevel1).map(([p]) => p.pub_categoryLevel1);
    expect(new Set(categories)).toEqual(new Set(['Fashion', 'Baby-Kids']));
  });

  it('includes images and currentStock in all category queries', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    calls
      .filter(([p]) => p.pub_categoryLevel1)
      .forEach(([params]) => {
        expect(params.include).toEqual(expect.arrayContaining(['images', 'currentStock']));
      });
  });

  it('shows loading carousels while fetching', () => {
    mockQuery.mockReturnValue(new Promise(() => {}));
    renderInContext(<CategoryShowcase />);
    expect(screen.getAllByTestId('carousel-loading').length).toBeGreaterThanOrEqual(2);
  });

  it('renders both category carousels with correct titles after load', async () => {
    await renderAndWaitForLoad(<CategoryShowcase />);
    const titles = screen.getAllByTestId('product-carousel').map(el => el.getAttribute('data-title'));
    expect(titles).toEqual(expect.arrayContaining(['Indian Fashion', 'Baby & Kids']));
    expect(titles).toHaveLength(2);
  });
});

// ── AgeNavigation ─────────────────────────────────────────────────────────────
// P1.3: no longer rendered by CategoryShowcase (relocated to the Baby & Kids
// category page) — render it directly here instead.

describe('AgeNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
  });

  it('queries every configured brand for each age group', async () => {
    renderInContext(<AgeNavigation config={{}} />);
    await screen.findAllByTestId('product-carousel');
    const ageCalls = mockQuery.mock.calls.filter(([p]) => p.pub_age_group);
    expect(ageCalls).toHaveLength(TEST_BRAND_IDS.length * 3); // 3 brands × 3 age groups
    ageCalls.forEach(([params]) => {
      expect(TEST_BRAND_IDS).toContain(params.author_id);
      expect(params.perPage).toBe(2);
    });
  });

  it('queries newborn, 0_6_months, 6_12_months', async () => {
    renderInContext(<AgeNavigation config={{}} />);
    await screen.findAllByTestId('product-carousel');
    const groups = mockQuery.mock.calls.filter(([p]) => p.pub_age_group).map(([p]) => p.pub_age_group);
    expect(groups).toEqual(
      expect.arrayContaining(['newborn', '0_6_months', '6_12_months'])
    );
  });

  it('renders age group carousels with correct titles after load', async () => {
    renderInContext(<AgeNavigation config={{}} />);
    await screen.findAllByTestId('product-carousel');
    const titles = screen.getAllByTestId('product-carousel').map(el => el.getAttribute('data-title'));
    expect(titles).toEqual(
      expect.arrayContaining(['Newborn', '0-6 Months', '6-12 Months'])
    );
  });
});

// ── OccasionStrip ─────────────────────────────────────────────────────────────

describe('OccasionStrip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
  });

  it('queries every configured brand for each occasion', async () => {
    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      const calls = mockQuery.mock.calls.filter(([p]) => p.pub_occasion);
      expect(calls).toHaveLength(TEST_BRAND_IDS.length * 2); // 3 brands × 2 occasions
      calls.forEach(([params]) => {
        expect(TEST_BRAND_IDS).toContain(params.author_id);
        expect(params.perPage).toBe(2);
      });
    });
  });

  it('queries diwali-festivals and gifting occasions', async () => {
    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      const occasions = mockQuery
        .mock.calls.filter(([p]) => p.pub_occasion)
        .map(([p]) => p.pub_occasion);
      expect(occasions).toEqual(
        expect.arrayContaining(['diwali-festivals', 'gifting'])
      );
    });
  });

  it('shows occasion panel headings during loading', () => {
    mockQuery.mockReturnValue(new Promise(() => {}));
    renderInContext(<OccasionStrip />);

    expect(screen.getByText('Diwali & Festivals')).toBeInTheDocument();
    expect(screen.getByText('Gifting')).toBeInTheDocument();
  });

  it('renders listing cards when products have matching occasion tag', async () => {
    const diwaliListings = Array.from({ length: 3 }, (_, i) =>
      makeListing(`d-${i}`, { occasionTag: 'diwali-festivals' })
    );
    const giftingListings = Array.from({ length: 3 }, (_, i) =>
      makeListing(`g-${i}`, { occasionTag: 'gifting' })
    );

    denormalisedEntities
      .mockReturnValueOnce(diwaliListings) // diwali-festivals
      .mockReturnValueOnce(giftingListings); // gifting

    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      expect(screen.getAllByTestId('listing-card').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('hides the entire strip when no occasion has >= 2 products with matching tag', async () => {
    // Both occasions return listings WITHOUT a matching occasion tag → all filtered out
    denormalisedEntities.mockReturnValue([makeListing('no-tag')]);

    const { container } = renderInContext(<OccasionStrip />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('hides the strip when SDK returns no products at all', async () => {
    denormalisedEntities.mockReturnValue([]);

    const { container } = renderInContext(<OccasionStrip />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('client-side filters out listings that lack the matching occasion tag', async () => {
    // diwali: nothing; gifting: 2 valid + 1 without tag
    const mixedGiftingListings = [
      makeListing('g1', { occasionTag: 'gifting' }),
      makeListing('g2', { occasionTag: 'gifting' }),
      makeListing('g3', { occasionTag: null }), // should be filtered
    ];

    denormalisedEntities
      .mockReturnValueOnce([]) // diwali → hidden
      .mockReturnValueOnce(mixedGiftingListings); // gifting: 2 pass, 1 blocked

    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      // Only the 2 correctly-tagged cards should render
      expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
    });
  });

  it('accepts occasion stored as a plain string (legacy publicData format)', async () => {
    // Before schema config was loaded, occasion was stored as a plain string
    const legacyListings = [
      { ...makeListing('l1'), attributes: { ...makeListing('l1').attributes, publicData: { occasion: 'gifting' } } },
      { ...makeListing('l2'), attributes: { ...makeListing('l2').attributes, publicData: { occasion: 'gifting' } } },
    ];

    denormalisedEntities
      .mockReturnValueOnce([]) // diwali
      .mockReturnValueOnce(legacyListings); // gifting

    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
    });
  });

  it('passes additionalQueryParams through to the SDK query', async () => {
    const extra = { pub_categoryLevel1: 'Fashion' };
    renderInContext(<OccasionStrip additionalQueryParams={extra} />);

    await waitFor(() => {
      mockQuery
        .mock.calls.filter(([p]) => p.pub_occasion)
        .forEach(([params]) => {
          expect(params.pub_categoryLevel1).toBe('Fashion');
        });
    });
  });

  describe('isBestseller badge', () => {
    it('passes isBestseller=true only when publicData.isBestseller is set', async () => {
      const listings = [
        makeListing('g1', { occasionTag: 'gifting', isBestseller: true }),
        makeListing('g2', { occasionTag: 'gifting' }),
        makeListing('g3', { occasionTag: 'gifting' }),
      ];

      denormalisedEntities
        .mockReturnValueOnce([]) // diwali → hidden
        .mockReturnValueOnce(listings); // gifting

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('listing-card');
        expect(cards[0]).toHaveAttribute('data-is-bestseller', 'true');
        expect(cards[1]).toHaveAttribute('data-is-bestseller', 'false');
        expect(cards[2]).toHaveAttribute('data-is-bestseller', 'false');
      });
    });

    it('does not mark the first-position listing as bestseller when publicData.isBestseller is absent', async () => {
      const listings = [
        makeListing('g1', { occasionTag: 'gifting' }), // index 0, no isBestseller
        makeListing('g2', { occasionTag: 'gifting' }),
      ];

      denormalisedEntities
        .mockReturnValueOnce([]) // diwali → hidden
        .mockReturnValueOnce(listings); // gifting

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        screen.getAllByTestId('listing-card').forEach(card => {
          expect(card).toHaveAttribute('data-is-bestseller', 'false');
        });
      });
    });
  });

  describe('seasonal ordering', () => {
    const setup = async () => {
      const diwaliListings = [
        makeListing('d1', { occasionTag: 'diwali-festivals' }),
        makeListing('d2', { occasionTag: 'diwali-festivals' }),
      ];
      const giftingListings = [
        makeListing('g1', { occasionTag: 'gifting' }),
        makeListing('g2', { occasionTag: 'gifting' }),
      ];

      denormalisedEntities
        .mockReturnValueOnce(diwaliListings)
        .mockReturnValueOnce(giftingListings);

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        expect(screen.getAllByTestId('listing-card').length).toBeGreaterThanOrEqual(4);
      });

      return screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
    };

    it('shows Diwali & Festivals first during Oct 1 – Nov 15', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-10-20'));
      const order = await setup();
      jest.useRealTimers();
      expect(order[0]).toBe('Diwali & Festivals');
    });

    it('shows Gifting first outside Diwali season', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-07-04'));
      const order = await setup();
      jest.useRealTimers();
      expect(order[0]).toBe('Gifting');
    });
  });
});
