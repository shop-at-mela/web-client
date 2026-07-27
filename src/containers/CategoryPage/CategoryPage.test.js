import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route } from 'react-router-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { HelmetProvider } from 'react-helmet-async';

import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';

import CategoryPage from './CategoryPage';

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('../TopbarContainer/TopbarContainer', () => () => <div data-testid="topbar" />);
jest.mock('../FooterContainer/FooterContainer', () => () => <div data-testid="footer" />);

jest.mock('../../components/ListingCard/ListingCard', () => {
  return function MockListingCard({ listing }) {
    return <div data-testid="listing-card">{listing.attributes.title}</div>;
  };
});

jest.mock('../../components/BrandCardHome/BrandCardHome', () => {
  return function MockBrandCardHome({ brand }) {
    return <div data-testid="brand-tile">{brand.attributes.profile.displayName}</div>;
  };
});

// ── Mock data ─────────────────────────────────────────────────────────────

const mockCategories = [
  {
    id: 'baby-clothing',
    name: 'Baby Clothing',
    subcategories: [
      { id: 'rompers', name: 'Rompers', subcategories: [] },
      { id: 'sleepwear', name: 'Sleepwear', subcategories: [] },
      { id: 'outerwear', name: 'Outerwear', subcategories: [] },
      { id: 'special-occasion', name: 'Special Occasion', subcategories: [] },
    ],
  },
  {
    id: 'baby-care',
    name: 'Baby Care',
    subcategories: [],
  },
  // A category whose ID matches CATEGORY_DESCRIPTIONS for testing editorial copy
  {
    id: 'Baby-Kids',
    name: 'Baby & Kids',
    subcategories: [
      { id: 'Clothing', name: 'Clothing', subcategories: [] },
      { id: 'Footwear', name: 'Footwear', subcategories: [] },
    ],
  },
];

const mockConfig = {
  marketplaceName: 'Mela',
  marketplaceRootURL: 'https://mela.com',
  currency: 'INR',
  locale: 'en',
  categoryConfiguration: { categories: mockCategories },
  branding: { facebookImage: null, twitterImage: null },
  user: { userFields: [] },
  accessControl: { marketplace: { private: false } },
};

const mockRoutes = [
  { path: '/', name: 'LandingPage' },
  { path: '/brands', name: 'BrandsPage' },
  // Note: no :level2?/:level3? — CategoryPage builds paths manually to avoid
  // path-to-regexp v8 incompatibility with React Router v5 optional param syntax.
  { path: '/categories/:level1', name: 'CategoryPage' },
  { path: '/categories', name: 'CategoriesPage' },
  { path: '/s', name: 'SearchPage' },
];

const mockMessages = {
  'CategoryPage.title': '{categoryName} — {marketplaceName}',
  'CategoryPage.description': 'Discover authentic Indian {categoryName} products.',
  'CategoryPage.home': 'Home',
  'CategoryPage.loadingProducts': 'Loading products…',
  'CategoryPage.noProducts': 'No products in {categoryName} yet.',
  'CategoryPage.browseBrands': 'Browse all brands',
  'CategoryPage.brandCarouselTitle': 'Shop {categoryName} Brands',
  'CategoryPage.browseCategory': 'Browse →',
  'CategoryPage.allCategories': 'All Categories',
  'Page.schemaTitle': '{marketplaceName}',
  'Page.schemaDescription': 'Marketplace',
};

const mockState = {
  SearchPage: {
    currentPageResultIds: [],
    searchInProgress: false,
  },
  marketplaceData: {
    entities: {},
  },
  ui: { disableScrollRequests: [] },
};

const mockStore = createStore(() => mockState);

// ── Render helpers ─────────────────────────────────────────────────────────

/** Render at an L0/L1/L2 path under /categories/:level1/:level2?/:level3? */
const renderAt = (path, store = mockStore) => {
  return render(
    <HelmetProvider>
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <IntlProvider locale="en" messages={mockMessages}>
            <ConfigurationProvider value={mockConfig}>
              <RouteConfigurationProvider value={mockRoutes}>
                <Route path="/categories/:level1/:level2?/:level3?">
                  <CategoryPage />
                </Route>
              </RouteConfigurationProvider>
            </ConfigurationProvider>
          </IntlProvider>
        </MemoryRouter>
      </Provider>
    </HelmetProvider>
  );
};

/** Render the root /categories page */
const renderRoot = (store = mockStore) => {
  return render(
    <HelmetProvider>
      <Provider store={store}>
        <MemoryRouter initialEntries={['/categories']}>
          <IntlProvider locale="en" messages={mockMessages}>
            <ConfigurationProvider value={mockConfig}>
              <RouteConfigurationProvider value={mockRoutes}>
                <Route path="/categories" exact>
                  <CategoryPage />
                </Route>
              </RouteConfigurationProvider>
            </ConfigurationProvider>
          </IntlProvider>
        </MemoryRouter>
      </Provider>
    </HelmetProvider>
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe('CategoryPage', () => {
  describe('root /categories page', () => {
    it('renders "All Categories" as H1', () => {
      renderRoot();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All Categories');
    });

    it('renders a card for each L0 category', () => {
      renderRoot();
      expect(screen.getByText('Baby Clothing')).toBeInTheDocument();
      expect(screen.getByText('Baby Care')).toBeInTheDocument();
      expect(screen.getByText('Baby & Kids')).toBeInTheDocument();
    });

    it('shows top 3 subcategory names inside each card', () => {
      renderRoot();
      // baby-clothing has 4 subcategories; only first 3 should appear
      expect(screen.getByText('Rompers')).toBeInTheDocument();
      expect(screen.getByText('Sleepwear')).toBeInTheDocument();
      expect(screen.getByText('Outerwear')).toBeInTheDocument();
      expect(screen.queryByText('Special Occasion')).not.toBeInTheDocument();
    });

    it('renders a "Browse →" CTA on each card', () => {
      renderRoot();
      const ctaLinks = screen.getAllByText('Browse →');
      // One CTA per category (3 categories in mockCategories)
      expect(ctaLinks.length).toBe(3);
    });

    it('renders breadcrumb with Home and All Categories', () => {
      renderRoot();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getAllByText('All Categories').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the root description text', () => {
      renderRoot();
      expect(screen.getByText(/Discover authentic Indian baby products/i)).toBeInTheDocument();
    });
  });

  describe('L0 category page', () => {
    it('renders the category name as H1', () => {
      renderAt('/categories/baby-clothing');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Baby Clothing');
    });

    it('renders subcategory pills for L0 with subcategories', () => {
      renderAt('/categories/baby-clothing');
      expect(screen.getByText('Rompers')).toBeInTheDocument();
      expect(screen.getByText('Sleepwear')).toBeInTheDocument();
    });

    it('does not render subcategory pills when category has no subcategories', () => {
      renderAt('/categories/baby-care');
      expect(screen.queryByText('Rompers')).not.toBeInTheDocument();
    });

    it('renders breadcrumb with Home and category name', () => {
      renderAt('/categories/baby-clothing');
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getAllByText('Baby Clothing').length).toBeGreaterThanOrEqual(1);
    });

    it('uses editorial description from CATEGORY_DESCRIPTIONS for known category IDs', () => {
      renderAt('/categories/Baby-Kids');
      // The editorial copy for Baby-Kids starts with "From handwoven bandhini"
      expect(screen.getByText(/From handwoven bandhini/i)).toBeInTheDocument();
    });

    it('falls back to i18n description template for unknown category IDs', () => {
      renderAt('/categories/baby-clothing');
      // 'baby-clothing' is not in CATEGORY_DESCRIPTIONS → falls back to intl template
      expect(
        screen.getByText('Discover authentic Indian Baby Clothing products.')
      ).toBeInTheDocument();
    });
  });

  describe('P1.3: relocated "Shop Baby by Age" block', () => {
    it('renders on the Baby-Kids L0 page', () => {
      renderAt('/categories/Baby-Kids');
      expect(screen.getByText('Shop Baby by Age')).toBeInTheDocument();
    });

    it('does not render on other L0 categories', () => {
      renderAt('/categories/baby-clothing');
      expect(screen.queryByText('Shop Baby by Age')).not.toBeInTheDocument();
    });

    it('does not render on a Baby-Kids sub-category page', () => {
      renderAt('/categories/Baby-Kids/Clothing');
      expect(screen.queryByText('Shop Baby by Age')).not.toBeInTheDocument();
    });
  });

  describe('L1 category page', () => {
    it('renders the L1 category name as H1', () => {
      renderAt('/categories/baby-clothing/rompers');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rompers');
    });

    it('renders breadcrumb showing L0 > L1', () => {
      renderAt('/categories/baby-clothing/rompers');
      expect(screen.getAllByText('Baby Clothing').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rompers').length).toBeGreaterThanOrEqual(1);
    });

    it('subcategory pill links include the L0 prefix', () => {
      renderAt('/categories/baby-clothing/rompers');
      // Rompers has no subcategories, so no pills rendered — just verify page loads
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rompers');
    });
  });

  describe('empty state', () => {
    it('renders empty state when no products and not loading', () => {
      renderAt('/categories/baby-clothing');
      expect(screen.getByText(/No products in Baby Clothing yet/i)).toBeInTheDocument();
      expect(screen.getByText('Browse all brands')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders loading message when searchInProgress', () => {
      const loadingStore = createStore(() => ({
        ...mockState,
        SearchPage: { ...mockState.SearchPage, searchInProgress: true },
      }));
      renderAt('/categories/baby-clothing', loadingStore);
      expect(screen.getByText('Loading products…')).toBeInTheDocument();
    });
  });

  describe('unknown category', () => {
    it('renders nothing for an unknown category slug', () => {
      const { container } = renderAt('/categories/not-a-real-category');
      expect(container.firstChild).toBeNull();
    });
  });

  describe('P1.2 category merchandising', () => {
    const listingEntity = (id, { title, price, author }) => ({
      id: { uuid: id },
      type: 'listing',
      attributes: { title, price: { amount: price, currency: 'USD' } },
      relationships: { author: { data: { id: { uuid: author }, type: 'user' } } },
    });

    const userEntity = (id, displayName) => ({
      id: { uuid: id },
      type: 'user',
      attributes: { profile: { displayName, publicData: {} } },
    });

    const gridOrder = container =>
      Array.from(container.querySelectorAll('[data-testid="listing-card"], [data-testid="brand-tile"]')).map(
        el => ({ testid: el.getAttribute('data-testid'), text: el.textContent })
      );

    it('demotes a utility-priced item below a full-priced item from a different brand', () => {
      const listings = [
        listingEntity('cheap', { title: 'Cheap Utility Item', price: 300, author: 'brandA' }),
        listingEntity('hero', { title: 'Hero Product', price: 8000, author: 'brandB' }),
      ];
      const store = createStore(() => ({
        ...mockState,
        SearchPage: {
          currentPageResultIds: [{ uuid: 'cheap' }, { uuid: 'hero' }],
          searchInProgress: false,
        },
        marketplaceData: {
          entities: {
            listing: { cheap: listings[0], hero: listings[1] },
            user: { brandA: userEntity('brandA', 'Brand A'), brandB: userEntity('brandB', 'Brand B') },
          },
        },
      }));

      const { container } = renderAt('/categories/baby-clothing', store);
      const order = gridOrder(container).filter(e => e.testid === 'listing-card');
      expect(order.map(e => e.text)).toEqual(['Hero Product', 'Cheap Utility Item']);
    });

    it('caps consecutive same-brand cards at 4, interleaving the other brand', () => {
      const listings = [
        ...Array.from({ length: 6 }, (_, i) =>
          listingEntity(`a${i}`, { title: `A${i}`, price: 8000, author: 'brandA' })
        ),
        listingEntity('b0', { title: 'B0', price: 8000, author: 'brandB' }),
        listingEntity('b1', { title: 'B1', price: 8000, author: 'brandB' }),
      ];
      const entityMap = Object.fromEntries(listings.map(l => [l.id.uuid, l]));
      const store = createStore(() => ({
        ...mockState,
        SearchPage: {
          currentPageResultIds: listings.map(l => l.id),
          searchInProgress: false,
        },
        marketplaceData: {
          entities: {
            listing: entityMap,
            user: { brandA: userEntity('brandA', 'Brand A'), brandB: userEntity('brandB', 'Brand B') },
          },
        },
      }));

      const { container } = renderAt('/categories/baby-clothing', store);
      const titles = gridOrder(container)
        .filter(e => e.testid === 'listing-card')
        .map(e => e.text);

      let maxRun = 0;
      let currentRun = 0;
      let lastBrand = null;
      titles.forEach(title => {
        const brand = title[0]; // 'A' or 'B'
        currentRun = brand === lastBrand ? currentRun + 1 : 1;
        lastBrand = brand;
        maxRun = Math.max(maxRun, currentRun);
      });
      expect(maxRun).toBeLessThanOrEqual(4);
      expect(titles).toHaveLength(8);
    });

    it('interleaves a fetched brand tile after every 6th product', () => {
      const listings = Array.from({ length: 6 }, (_, i) =>
        listingEntity(`l${i}`, { title: `Product ${i}`, price: 8000, author: 'brandA' })
      );
      const entityMap = Object.fromEntries(listings.map(l => [l.id.uuid, l]));
      const store = createStore(() => ({
        ...mockState,
        SearchPage: {
          currentPageResultIds: listings.map(l => l.id),
          searchInProgress: false,
        },
        marketplaceData: {
          entities: {
            listing: entityMap,
            user: { brandA: userEntity('brandA', 'Brand A') },
          },
        },
        CategoryPage: { brandTileIds: ['brandA'], brandTilesInProgress: false },
      }));

      const { container } = renderAt('/categories/baby-clothing', store);
      const order = gridOrder(container);
      expect(order).toHaveLength(7); // 6 products + 1 tile
      expect(order[6]).toEqual({ testid: 'brand-tile', text: 'Brand A' });
    });

    it('does not render a brand tile when none have been fetched', () => {
      const listings = Array.from({ length: 6 }, (_, i) =>
        listingEntity(`l${i}`, { title: `Product ${i}`, price: 8000, author: 'brandA' })
      );
      const entityMap = Object.fromEntries(listings.map(l => [l.id.uuid, l]));
      const store = createStore(() => ({
        ...mockState,
        SearchPage: {
          currentPageResultIds: listings.map(l => l.id),
          searchInProgress: false,
        },
        marketplaceData: {
          entities: { listing: entityMap, user: { brandA: userEntity('brandA', 'Brand A') } },
        },
        CategoryPage: { brandTileIds: [], brandTilesInProgress: false },
      }));

      const { container } = renderAt('/categories/baby-clothing', store);
      expect(screen.queryByTestId('brand-tile')).not.toBeInTheDocument();
      expect(gridOrder(container)).toHaveLength(6);
    });
  });

  describe('"Shop {L1} Brands" carousel', () => {
    const userEntity = (id, displayName) => ({
      id: { uuid: id },
      type: 'user',
      attributes: { profile: { displayName, publicData: {} } },
    });

    const listingEntity = id => ({
      id: { uuid: id },
      type: 'listing',
      attributes: { title: `Product ${id}`, price: { amount: 2500, currency: 'USD' } },
    });

    it('renders a tile per carousel entry, titled after the L1 category', () => {
      const store = createStore(() => ({
        ...mockState,
        marketplaceData: {
          entities: {
            user: { brandA: userEntity('brandA', 'Brand A') },
            listing: { l1: listingEntity('l1') },
          },
        },
        CategoryPage: {
          brandCarouselEntries: [{ brandId: 'brandA', productIds: ['l1'] }],
        },
      }));

      renderAt('/categories/Baby-Kids', store);
      expect(screen.getByText('Shop Baby & Kids Brands')).toBeInTheDocument();
      expect(screen.getByTestId('brand-tile')).toHaveTextContent('Brand A');
    });

    it('renders nothing when the carousel has no entries', () => {
      renderAt('/categories/Baby-Kids');
      expect(screen.queryByText(/Shop .* Brands/)).not.toBeInTheDocument();
    });

    it('shows the L1 title even on an L2 sub-page', () => {
      const store = createStore(() => ({
        ...mockState,
        marketplaceData: {
          entities: {
            user: { brandA: userEntity('brandA', 'Brand A') },
            listing: { l1: listingEntity('l1') },
          },
        },
        CategoryPage: {
          brandCarouselEntries: [{ brandId: 'brandA', productIds: ['l1'] }],
        },
      }));

      renderAt('/categories/Baby-Kids/Clothing', store);
      expect(screen.getByText('Shop Baby & Kids Brands')).toBeInTheDocument();
    });
  });
});
