import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import { ConfigurationProvider } from '../../../../context/configurationContext';
import CategoryShowcase, {
  OccasionStrip,
  OccasionMosaic,
  pickMosaicImages,
  getMosaicOccasionPool,
  selectMosaicOccasions,
  FESTIVAL_DATES_BY_YEAR,
  AgeNavigation,
  EXCLUDED_DISCOVERY_BRAND_SLUGS,
  getActiveSeasonOccasion,
} from './CategoryShowcase';

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
  NamedLink: ({ children, name, to, className, params, onClick }) => (
    <a
      onClick={onClick}
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
    // Fixed, off-season, non-wedding-season date so getActiveSeasonOccasion() resolves
    // deterministically to ['gifting', 'raksha_bandhan'] (the nearest upcoming dated
    // festival from mid-March) for every test in this block except 'seasonal ordering'
    // below, which sets its own dates to exercise the in-season/wedding-season branches.
    jest.useFakeTimers().setSystemTime(new Date('2026-03-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queries every configured brand for each active occasion', async () => {
    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      const calls = mockQuery.mock.calls.filter(([p]) => p.pub_occasion);
      expect(calls).toHaveLength(TEST_BRAND_IDS.length * 2); // 3 brands × 2 active occasions
      calls.forEach(([params]) => {
        expect(TEST_BRAND_IDS).toContain(params.author_id);
        expect(params.perPage).toBe(2);
      });
    });
  });

  it('queries gifting and the nearest-upcoming festival with has_any:', async () => {
    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      const occasions = mockQuery
        .mock.calls.filter(([p]) => p.pub_occasion)
        .map(([p]) => p.pub_occasion);
      expect(occasions).toEqual(
        expect.arrayContaining(['has_any:gifting', 'has_any:raksha_bandhan'])
      );
    });
  });

  it('shows occasion panel headings during loading', () => {
    mockQuery.mockReturnValue(new Promise(() => {}));
    renderInContext(<OccasionStrip />);

    expect(screen.getByText('Gifting')).toBeInTheDocument();
    expect(screen.getByText('Raksha Bandhan')).toBeInTheDocument();
  });

  it('renders listing cards when products have matching occasion tag', async () => {
    const giftingListings = Array.from({ length: 3 }, (_, i) =>
      makeListing(`g-${i}`, { occasionTag: 'gifting' })
    );
    const rakshaListings = Array.from({ length: 3 }, (_, i) =>
      makeListing(`r-${i}`, { occasionTag: 'raksha_bandhan' })
    );

    denormalisedEntities
      .mockReturnValueOnce(giftingListings) // gifting (leads off-season)
      .mockReturnValueOnce(rakshaListings); // raksha_bandhan

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
    // gifting: 2 valid + 1 without tag; raksha_bandhan: nothing
    const mixedGiftingListings = [
      makeListing('g1', { occasionTag: 'gifting' }),
      makeListing('g2', { occasionTag: 'gifting' }),
      makeListing('g3', { occasionTag: null }), // should be filtered
    ];

    denormalisedEntities
      .mockReturnValueOnce(mixedGiftingListings) // gifting: 2 pass, 1 blocked
      .mockReturnValueOnce([]); // raksha_bandhan → hidden

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
      .mockReturnValueOnce(legacyListings) // gifting
      .mockReturnValueOnce([]); // raksha_bandhan

    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
    });
  });

  it('matches Diwali listings tagged with either the current or legacy occasion value', async () => {
    // Diwali's matchValues covers both 'diwali' (current) and 'diwali-festivals' (legacy,
    // pre-backfill inventory) — only exercised directly here since the default fixture
    // date (off-season) doesn't put Diwali in the active set.
    jest.useFakeTimers().setSystemTime(new Date('2026-10-25')); // Diwali in season
    const mixedDiwaliListings = [
      makeListing('d1', { occasionTag: 'diwali' }),
      makeListing('d2', { occasionTag: 'diwali-festivals' }),
    ];
    denormalisedEntities.mockReturnValue(mixedDiwaliListings);

    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      expect(screen.getAllByTestId('listing-card').length).toBeGreaterThanOrEqual(2);
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
        .mockReturnValueOnce(listings) // gifting
        .mockReturnValueOnce([]); // raksha_bandhan → hidden

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
        .mockReturnValueOnce(listings) // gifting
        .mockReturnValueOnce([]); // raksha_bandhan → hidden

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        screen.getAllByTestId('listing-card').forEach(card => {
          expect(card).toHaveAttribute('data-is-bestseller', 'false');
        });
      });
    });
  });

  describe('seasonal ordering', () => {
    it('leads with the in-season festival, gifting trailing', async () => {
      // Only Navratri is in season on this date (its 21-day lead window doesn't overlap
      // any other dated festival's window — see getActiveSeasonOccasion's comments).
      jest.useFakeTimers().setSystemTime(new Date('2026-09-25'));

      const navratriListings = [
        makeListing('n1', { occasionTag: 'navratri' }),
        makeListing('n2', { occasionTag: 'navratri' }),
      ];
      const giftingListings = [
        makeListing('g1', { occasionTag: 'gifting' }),
        makeListing('g2', { occasionTag: 'gifting' }),
      ];

      denormalisedEntities
        .mockReturnValueOnce(navratriListings)
        .mockReturnValueOnce(giftingListings);

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        expect(screen.getAllByTestId('listing-card').length).toBeGreaterThanOrEqual(4);
      });

      const order = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(order).toEqual(['Navratri', 'Gifting']);
    });

    it('leads with gifting, nearest-upcoming festival trailing, off-season', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-15'));

      const giftingListings = [
        makeListing('g1', { occasionTag: 'gifting' }),
        makeListing('g2', { occasionTag: 'gifting' }),
      ];
      const rakshaListings = [
        makeListing('r1', { occasionTag: 'raksha_bandhan' }),
        makeListing('r2', { occasionTag: 'raksha_bandhan' }),
      ];

      denormalisedEntities
        .mockReturnValueOnce(giftingListings)
        .mockReturnValueOnce(rakshaListings);

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        expect(screen.getAllByTestId('listing-card').length).toBeGreaterThanOrEqual(4);
      });

      const order = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(order).toEqual(['Gifting', 'Raksha Bandhan']);
    });

    it('includes Wedding Season during wedding season (Nov-Feb)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-12-15'));

      const weddingListings = [
        makeListing('w1', { occasionTag: 'wedding' }),
        makeListing('w2', { occasionTag: 'wedding' }),
      ];
      const giftingListings = [
        makeListing('g1', { occasionTag: 'gifting' }),
        makeListing('g2', { occasionTag: 'gifting' }),
      ];

      denormalisedEntities
        .mockReturnValueOnce(weddingListings)
        .mockReturnValueOnce(giftingListings);

      renderInContext(<OccasionStrip />);

      await waitFor(() => {
        expect(screen.getAllByTestId('listing-card').length).toBeGreaterThanOrEqual(4);
      });

      const order = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(order).toEqual(['Wedding Season', 'Gifting']);
    });

    it('never returns more than 3 occasions even when several festivals overlap in season', () => {
      // Late Oct: Karva Chauth, Diwali, and Bhai Dooj windows all overlap.
      const options = getActiveSeasonOccasion(new Date('2026-10-25'));
      expect(options.length).toBeLessThanOrEqual(3);
      expect(options).toContain('gifting');
    });
  });
});

// ── OccasionMosaic ─────────────────────────────────────────────────────────────

const makeMosaicListing = (id, occasionTag, { authorId = 'brand-1', withImage = true } = {}) => ({
  ...makeListing(id, { occasionTag }),
  author: { id: { uuid: authorId } },
  images: withImage
    ? [
        {
          attributes: {
            variants: {
              'scaled-medium': { url: `https://img.test/${id}-750.jpg` },
              'scaled-large': { url: `https://img.test/${id}-1024.jpg` },
            },
          },
        },
      ]
    : [],
});

describe('OccasionMosaic', () => {
  // Late October 2026: Karva Chauth, Diwali and Bhai Dooj are in season, so the pool
  // (nearest first) is ['karva_chauth', 'diwali', 'bhai_dooj', 'gifting'], queried in that order.
  const IN_SEASON_DATE = new Date('2026-10-24T12:00:00');

  // Enough listings to clear the mosaic's minimum-inventory bar.
  const stocked = (prefix, tag, n = 10) =>
    Array.from({ length: n }, (_, i) => makeMosaicListing(`${prefix}${i}`, tag));

  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    window.dataLayer = [];
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
  });

  afterEach(() => {
    Math.random.mockRestore();
  });

  const mockOccasionResults = (...resultsInOrder) => {
    resultsInOrder.forEach(result => denormalisedEntities.mockReturnValueOnce(result));
  };

  const mockAllStocked = () =>
    mockOccasionResults(
      stocked('k', 'karva_chauth'),
      stocked('d', 'diwali'),
      stocked('b', 'bhai_dooj'),
      stocked('g', 'gifting')
    );

  it('makes one marketplace-wide query per pool occasion, not a per-brand fan-out', async () => {
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);

    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(4));
    const occasions = mockQuery.mock.calls.map(([p]) => p.pub_occasion);
    expect(occasions).toEqual([
      'has_any:karva_chauth',
      'has_any:diwali,diwali-festivals',
      'has_any:bhai_dooj',
      'has_any:gifting',
    ]);
    mockQuery.mock.calls.forEach(([params]) => {
      expect(params.author_id).toBeUndefined();
      expect(params.include).toContain('images');
      expect(params.perPage).toBe(12);
    });
  });

  it('renders nearest-first equal tiles with labels, search links and decorative photos', async () => {
    mockAllStocked();
    const { container } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);

    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(4));

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Shop by Occasion');
    const tiles = screen.getAllByTestId('link-SearchPage');
    expect(tiles.map(t => t.textContent)).toEqual([
      'Karva Chauth',
      'Diwali & Festivals',
      'Bhai DoojGifts for siblings',
      'Gifting',
    ]);
    expect(tiles[0]).toHaveAttribute('href', '?pub_occasion=has_any%3Akarva_chauth');
    // Decorative photo: the white label is the link's accessible name
    expect(tiles[0].querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.getByRole('group', { name: 'Occasions' })).toBeInTheDocument();
  });

  it('sets one column per tile (max 4) so a short row fills the width', async () => {
    mockOccasionResults(
      [makeMosaicListing('k1', 'karva_chauth')], // thin: dropped
      stocked('d', 'diwali'),
      stocked('b', 'bhai_dooj'),
      stocked('g', 'gifting')
    );
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(3));
    expect(screen.getByRole('group', { name: 'Occasions' }).style.getPropertyValue('--tile-count')).toBe('3');
  });

  it('shows the Bhai Dooj subtitle on its tile only', async () => {
    mockAllStocked();
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(4));
    expect(screen.getAllByText('Gifts for siblings')).toHaveLength(1);
  });

  it('loads the first two photos eagerly and the rest lazily', async () => {
    mockAllStocked();
    const { container } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(4));
    const loading = [...container.querySelectorAll('img')].map(i => i.getAttribute('loading'));
    expect(loading).toEqual(['eager', 'eager', 'lazy', 'lazy']);
  });

  it('shows no product row under any occasion', async () => {
    mockAllStocked();
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(4));
    expect(screen.queryByTestId('listing-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-carousel')).not.toBeInTheDocument();
  });

  const container_imgs = () => document.querySelectorAll('img');

  it('while loading shows labelled, linked placeholder tiles with no photos', () => {
    mockQuery.mockReturnValue(new Promise(() => {}));
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    const tiles = screen.getAllByTestId('link-SearchPage');
    expect(tiles.map(t => t.textContent)).toEqual([
      'Karva Chauth',
      'Diwali & Festivals',
      'Bhai DoojGifts for siblings',
      'Gifting',
    ]);
    expect(container_imgs()).toHaveLength(0);
  });

  it('skips thinly stocked occasions and fills tiles from the stocked ones', async () => {
    mockOccasionResults(
      [makeMosaicListing('k1', 'karva_chauth')], // 1 listing: below the inventory bar
      stocked('d', 'diwali'),
      stocked('b', 'bhai_dooj'),
      stocked('g', 'gifting')
    );
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(3));
    expect(screen.queryByText('Karva Chauth')).not.toBeInTheDocument();
  });

  it('always keeps the two nearest occasions and fills the other slots at random', async () => {
    // Nov 1 2026: pool is [diwali, bhai_dooj, karva_chauth (just passed), wedding, gifting]
    mockOccasionResults(
      stocked('d', 'diwali'),
      stocked('b', 'bhai_dooj'),
      stocked('k', 'karva_chauth'),
      stocked('w', 'wedding'),
      stocked('g', 'gifting')
    );
    Math.random.mockReturnValue(0);
    renderInContext(<OccasionMosaic date={new Date('2026-11-01T12:00:00')} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(4));
    const labels = screen.getAllByTestId('link-SearchPage').map(t => t.textContent);
    expect(labels.slice(0, 2)).toEqual(['Diwali & Festivals', 'Bhai DoojGifts for siblings']);
    expect(labels).toHaveLength(4);
  });

  it('falls back to thinly stocked occasions when fewer than 2 are sizeable', async () => {
    // Mid-March: pool is ['gifting', 'raksha_bandhan']
    mockOccasionResults([makeMosaicListing('g1', 'gifting')], []);
    renderInContext(<OccasionMosaic date={new Date('2026-03-15T12:00:00')} />);

    await waitFor(() => expect(container_imgs()).toHaveLength(1));
    expect(screen.getByTestId('link-SearchPage')).toHaveTextContent('Gifting');
  });

  it('renders nothing when no occasion has a usable listing', async () => {
    const { container } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('ignores listings without the occasion tag, without an image, or from excluded brands', async () => {
    mockOccasionResults(
      [
        makeMosaicListing('wrong-tag', 'gifting'),
        makeMosaicListing('no-image', 'karva_chauth', { withImage: false }),
        makeMosaicListing('not-configured', 'karva_chauth', { authorId: 'brand-x' }),
      ],
      stocked('d', 'diwali'),
      stocked('b', 'bhai_dooj'),
      stocked('g', 'gifting')
    );
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(3));
    expect(screen.queryByText('Karva Chauth')).not.toBeInTheDocument();
  });

  it('hides an occasion whose query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('429')).mockResolvedValue(emptyQueryResponse());
    mockOccasionResults(stocked('d', 'diwali'), stocked('b', 'bhai_dooj'), stocked('g', 'gifting'));
    renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container_imgs()).toHaveLength(3));
    expect(screen.queryByText('Karva Chauth')).not.toBeInTheDocument();
  });

  it('picks photos by shuffling candidates rather than taking the first listing', async () => {
    mockAllStocked();
    Math.random.mockReturnValue(0);
    const { container } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(4));
    const srcs = [...container.querySelectorAll('img')].map(i => i.getAttribute('src'));
    expect(new Set(srcs).size).toBe(4);
    // The un-shuffled pick would be the first listing ('k0', 'd0', ...)
    expect(srcs.some(src => /-(?:k|d|b|g)0-750/.test(src))).toBe(false);
  });

  it('keeps the same tiles for the rest of the session without querying again', async () => {
    mockAllStocked();
    const first = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(first.container.querySelectorAll('img')).toHaveLength(4));
    const firstSrcs = [...first.container.querySelectorAll('img')].map(i => i.getAttribute('src'));
    first.unmount();
    mockQuery.mockClear();

    Math.random.mockReturnValue(0.3); // a re-pick would shuffle differently
    const second = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(second.container.querySelectorAll('img')).toHaveLength(4));
    const secondSrcs = [...second.container.querySelectorAll('img')].map(i => i.getAttribute('src'));
    expect(secondSrcs).toEqual(firstSrcs);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('does not reuse a stored pick from a different day', async () => {
    mockAllStocked();
    const first = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(first.container.querySelectorAll('img')).toHaveLength(4));
    first.unmount();
    mockQuery.mockClear();

    renderInContext(<OccasionMosaic date={new Date('2026-10-25T12:00:00')} />);
    await waitFor(() => expect(mockQuery).toHaveBeenCalled());
  });

  it('gives up on a hung query after the timeout and drops the section', async () => {
    jest.useFakeTimers();
    try {
      mockQuery.mockReturnValue(new Promise(() => {}));
      const { container } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
      await act(async () => {
        jest.advanceTimersByTime(6100);
      });
      expect(container).toBeEmptyDOMElement();
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not update state or warn when unmounted before the queries finish', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let resolveQuery;
    mockQuery.mockReturnValue(new Promise(resolve => (resolveQuery = resolve)));
    const { unmount } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    unmount();
    await act(async () => {
      resolveQuery(emptyQueryResponse());
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('pushes an impression per tile and a click event with position and listing id', async () => {
    mockAllStocked();
    const { container } = renderInContext(<OccasionMosaic date={IN_SEASON_DATE} />);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(4));

    const impressions = window.dataLayer.filter(e => e.event === 'mosaic_impression');
    expect(impressions.map(e => [e.occasion, e.position, e.tile_count])).toEqual([
      ['karva_chauth', 1, 4],
      ['diwali', 2, 4],
      ['bhai_dooj', 3, 4],
      ['gifting', 4, 4],
    ]);
    impressions.forEach(e => expect(e.listing_id).toBeTruthy());

    fireEvent.click(screen.getAllByTestId('link-SearchPage')[2]);
    const click = window.dataLayer.find(e => e.event === 'mosaic_tile_click');
    expect(click).toMatchObject({ occasion: 'bhai_dooj', position: 3, tile_count: 4 });
    expect(click.listing_id).toBeTruthy();
  });
});

describe('festival calendar', () => {
  it('has dates for the current year — add next year before January (verify against a panchang)', () => {
    expect(FESTIVAL_DATES_BY_YEAR[new Date().getFullYear()]).toBeDefined();
  });
});

describe('getMosaicOccasionPool', () => {
  it('lists every in-season festival nearest first, then gifting', () => {
    // Late Oct: Karva Chauth, Diwali and Bhai Dooj overlap — getActiveSeasonOccasion caps at 2
    expect(getMosaicOccasionPool(new Date('2026-10-24T12:00:00'))).toEqual([
      'karva_chauth',
      'diwali',
      'bhai_dooj',
      'gifting',
    ]);
  });

  it('puts a festival that just passed behind upcoming ones', () => {
    expect(getMosaicOccasionPool(new Date('2026-11-01T12:00:00'))).toEqual([
      'diwali',
      'bhai_dooj',
      'karva_chauth',
      'wedding',
      'gifting',
    ]);
  });

  it('adds wedding during wedding season', () => {
    expect(getMosaicOccasionPool(new Date('2026-11-05T12:00:00'))).toEqual([
      'diwali',
      'bhai_dooj',
      'wedding',
      'gifting',
    ]);
  });

  it('falls back to gifting + nearest festival off-season', () => {
    const march = new Date('2026-03-15T12:00:00');
    expect(getMosaicOccasionPool(march)).toEqual(getActiveSeasonOccasion(march));
  });
});

describe('selectMosaicOccasions', () => {
  const photos = n => Array.from({ length: n }, (_, i) => ({ listingId: `x${i}` }));
  const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
  const full = pool.reduce((acc, o) => ({ ...acc, [o]: photos(10) }), {});

  it('picks at most 4 occasions and always keeps the first two', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      const picked = selectMosaicOccasions(pool, full, () => r);
      expect(picked).toHaveLength(4);
      expect(picked.slice(0, 2)).toEqual(['a', 'b']);
    }
  });

  it('returns the chosen occasions in pool (priority) order', () => {
    const picked = selectMosaicOccasions(pool, full, () => 0.99);
    expect(picked).toEqual([...picked].sort((x, y) => pool.indexOf(x) - pool.indexOf(y)));
  });

  it('can pick different extra occasions on different draws', () => {
    const seen = new Set();
    for (const r of [0, 0.3, 0.6, 0.99]) {
      seen.add(selectMosaicOccasions(pool, full, () => r).join());
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('only considers occasions with sizeable inventory', () => {
    const picked = selectMosaicOccasions(pool, { ...full, a: photos(2), b: photos(4) }, () => 0.1);
    expect(picked).toHaveLength(4);
    expect(picked).not.toContain('a');
    expect(picked).not.toContain('b');
  });

  it('counts 5 usable photos as sizeable', () => {
    expect(selectMosaicOccasions(['a', 'b'], { a: photos(5), b: photos(5) })).toEqual(['a', 'b']);
  });

  it('never exceeds the pool size', () => {
    expect(selectMosaicOccasions(['a', 'b'], full, () => 0.1)).toHaveLength(2);
  });
});

describe('pickMosaicImages', () => {
  it('never shows the same listing photo on two tiles', () => {
    const shared = { listingId: 'shared', url: 'a', url2x: 'a2' };
    const other = { listingId: 'other', url: 'b', url2x: 'b2' };
    const picks = pickMosaicImages([{ option: 'diwali' }, { option: 'gifting' }], {
      diwali: [shared],
      gifting: [shared, other],
    });
    expect(picks.diwali).toBe(shared);
    expect(picks.gifting).toBe(other);
  });

  it('returns null for a tile with no unused candidate', () => {
    const shared = { listingId: 'shared', url: 'a', url2x: 'a2' };
    const picks = pickMosaicImages([{ option: 'diwali' }, { option: 'gifting' }], {
      diwali: [shared],
      gifting: [shared],
    });
    expect(picks.gifting).toBeNull();
  });

  it('prefers a brand no earlier tile used, so one brand\'s drop does not fill the mosaic', () => {
    const a1 = { listingId: 'a1', brandId: 'A', url: 'a1', url2x: 'a1' };
    const a2 = { listingId: 'a2', brandId: 'A', url: 'a2', url2x: 'a2' };
    const b1 = { listingId: 'b1', brandId: 'B', url: 'b1', url2x: 'b1' };
    const picks = pickMosaicImages([{ option: 'diwali' }, { option: 'gifting' }], {
      diwali: [a1],
      gifting: [a2, b1],
    });
    expect(picks.gifting).toBe(b1);
  });

  it('reuses a brand when no other brand has a photo for that tile', () => {
    const a1 = { listingId: 'a1', brandId: 'A', url: 'a1', url2x: 'a1' };
    const a2 = { listingId: 'a2', brandId: 'A', url: 'a2', url2x: 'a2' };
    const picks = pickMosaicImages([{ option: 'diwali' }, { option: 'gifting' }], {
      diwali: [a1],
      gifting: [a2],
    });
    expect(picks.gifting).toBe(a2);
  });
});
