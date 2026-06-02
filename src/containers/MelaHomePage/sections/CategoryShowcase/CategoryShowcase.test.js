import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import { ConfigurationProvider } from '../../../../context/configurationContext';
import CategoryShowcase, { OccasionStrip } from './CategoryShowcase';

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
  ListingCard: ({ listing }) => (
    <div data-testid="listing-card" data-id={listing?.id?.uuid}>
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

/** Minimal listing. occasionTag populates publicData.occasion for OccasionStrip's client-side filter. */
const makeListing = (id, { occasionTag = null } = {}) => ({
  id: { uuid: id },
  type: 'listing',
  attributes: {
    title: `Product ${id}`,
    price: { amount: 1500, currency: 'USD' },
    publicData: occasionTag ? { occasion: occasionTag } : {},
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

  it('renders the section sub-heading', () => {
    renderInContext(<CategoryShowcase />);
    expect(
      screen.getByText(/Baby, fashion, home, jewelry and wellness/i)
    ).toBeInTheDocument();
  });

  it('renders Browse All Categories link', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.getByText(/Browse All Categories/i)).toBeInTheDocument();
  });

  it('renders the Shop Baby by Age heading', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.getByText('Shop Baby by Age')).toBeInTheDocument();
  });

  it('renders the Shop by Occasion heading', () => {
    renderInContext(<CategoryShowcase />);
    expect(screen.getByText('Shop by Occasion')).toBeInTheDocument();
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
// All 7 top-level categories (Baby & Kids, Fashion, Home & Kitchen, Jewelry &
// Accessories, Beauty & Wellness, Food & Gourmet, Art & Craft) are fetched by
// a single carousel component using ALL_CATEGORIES, all with perPage: 24 + pickRandom.

describe('AllCategoryCarousels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
  });

  it('queries all 7 categories with perPage: 24', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    const catCalls = calls.filter(([p]) => p.pub_categoryLevel1 && p.perPage === 24);
    expect(catCalls).toHaveLength(7);
  });

  it('queries Baby-Kids, Fashion, Home-Kitchen, Jewelry-Accessories, Beauty-Wellness, Food-Gourmet, Art-Craft', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    const categories = calls
      .filter(([p]) => p.pub_categoryLevel1 && p.perPage === 24)
      .map(([p]) => p.pub_categoryLevel1);
    expect(categories).toEqual(
      expect.arrayContaining([
        'Baby-Kids',
        'Fashion',
        'Home-Kitchen',
        'Jewelry-Accessories',
        'Beauty-Wellness',
        'Food-Gourmet',
        'Art-Craft',
      ])
    );
  });

  it('includes images and currentStock in all category queries', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    calls
      .filter(([p]) => p.pub_categoryLevel1 && p.perPage === 24)
      .forEach(([params]) => {
        expect(params.include).toEqual(expect.arrayContaining(['images', 'currentStock']));
      });
  });

  it('shows loading carousels while fetching', () => {
    mockQuery.mockReturnValue(new Promise(() => {}));
    renderInContext(<CategoryShowcase />);
    // AllCategories(7) + AgeNavigation(3) = at least 7 loading carousels
    expect(screen.getAllByTestId('carousel-loading').length).toBeGreaterThanOrEqual(7);
  });

  it('renders all 7 category carousels with correct titles after load', async () => {
    await renderAndWaitForLoad(<CategoryShowcase />);
    const titles = screen.getAllByTestId('product-carousel').map(el => el.getAttribute('data-title'));
    expect(titles).toEqual(
      expect.arrayContaining([
        'Baby & Kids',
        'Indian Fashion',
        'Home & Kitchen',
        'Jewelry & Accessories',
        'Beauty & Wellness',
        'Food & Gourmet',
        'Art & Craft',
      ])
    );
  });
});

// ── AgeNavigation ─────────────────────────────────────────────────────────────

describe('AgeNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue(emptyQueryResponse());
    denormalisedEntities.mockReturnValue([]);
  });

  it('queries each age group with perPage: 24', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    const ageCalls = calls.filter(([p]) => p.pub_age_group);
    expect(ageCalls).toHaveLength(3);
    ageCalls.forEach(([params]) => expect(params.perPage).toBe(24));
  });

  it('queries newborn, 0_6_months, 6_12_months', async () => {
    const calls = await renderAndWaitForLoad(<CategoryShowcase />);
    const groups = calls.filter(([p]) => p.pub_age_group).map(([p]) => p.pub_age_group);
    expect(groups).toEqual(
      expect.arrayContaining(['newborn', '0_6_months', '6_12_months'])
    );
  });

  it('renders age group carousels with correct titles after load', async () => {
    await renderAndWaitForLoad(<CategoryShowcase />);
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

  it('queries each occasion with perPage: 18', async () => {
    renderInContext(<OccasionStrip />);

    await waitFor(() => {
      const calls = mockQuery.mock.calls.filter(([p]) => p.pub_occasion);
      expect(calls).toHaveLength(2);
      calls.forEach(([params]) => {
        expect(params.perPage).toBe(18);
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
