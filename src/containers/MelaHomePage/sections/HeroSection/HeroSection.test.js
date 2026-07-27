import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';

import { ConfigurationProvider } from '../../../../context/configurationContext';

// Break the import chain: components/index.js → UserNav → routeConfiguration → pageDataLoadingAPI → ducks
jest.mock('../../../../routing/routeConfiguration', () => []);

// ── Mock the BrandsPage duck selectors and actions ────────────────────────────
// getHeroBrands owns the "filter brands with no hero source" behavior (and,
// deliberately, has no products dependency at all — a brand with a hero
// image but zero bestseller/configured products still qualifies) — that
// logic is tested in BrandsPage.duck.test.js. Here the mock passes the state
// list straight through so we can drive HeroSection's wiring.
jest.mock('../../../BrandsPage/BrandsPage.duck', () => ({
  fetchHeroBrands: () => ({ type: 'FETCH_HERO_BRANDS' }),
  getHeroBrands: state => state.BrandsPage?.heroBrands ?? [],
  getHeroBrandsInProgress: state => state.BrandsPage?.fetchInProgress ?? false,
  getHeroBrandsError: state => state.BrandsPage?.fetchError ?? null,
}));

// Mock BrandHeroCard — we test HeroSection's wiring, not BrandHeroCard internals
jest.mock('../../../../components/BrandHeroCard/BrandHeroCard', () => {
  const BrandHeroCard = ({ brand, heroImageUrlById, isPriority }) => (
    <div
      data-testid="brand-hero-card"
      data-brand-name={brand?.attributes?.profile?.displayName}
      data-hero-url-count={Object.keys(heroImageUrlById || {}).length}
      data-is-priority={String(isPriority)}
    />
  );
  BrandHeroCard.displayName = 'BrandHeroCard';
  return { __esModule: true, default: BrandHeroCard };
});

jest.mock('../../../../components', () => ({
  NamedLink: ({ children, name, className }) => (
    <a data-testid={`link-${name}`} className={className} href={`/${name}`}>
      {children}
    </a>
  ),
}));

import HeroSection from './HeroSection';

// jsdom has no Element#scrollTo — the carousel track syncs scroll position on
// index changes.
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// No `products` field — getHeroBrands entries never carry one (see gap-#1
// fix note above); a fixture that included it would misrepresent the real
// selector shape HeroSection actually receives.
const makeHeroBrand = (name, id = `brand-${name}`) => ({
  brand: {
    id: { uuid: id },
    type: 'user',
    attributes: {
      profile: {
        displayName: name,
        bio: `${name} bio.`,
        publicData: {
          brandHeroImageIds: [`${id}-img-0`],
          brandHeroImageListingIds: [`${id}-listing-0`],
          brandHeroImages: [`https://cdn.shopify.com/${id}-0.jpg`],
        },
      },
    },
  },
  heroImageUrlById: { [`${id}-img-0`]: `https://sharetribe.imgix.net/${id}-0.jpg` },
});

const mockConfig = {
  marketplaceName: 'Mela',
  categoryConfiguration: { categories: [] },
};

const renderHeroSection = (brandsState = {}) => {
  const defaultBrandsPage = {
    heroBrands: [],
    fetchInProgress: false,
    fetchError: null,
    ...brandsState,
  };

  const store = createStore(() => ({ BrandsPage: defaultBrandsPage }));

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <IntlProvider locale="en" messages={{}}>
          <ConfigurationProvider value={mockConfig}>
            <HeroSection />
          </ConfigurationProvider>
        </IntlProvider>
      </MemoryRouter>
    </Provider>
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HeroSection', () => {
  describe('Static content', () => {
    it('renders the headline', () => {
      renderHeroSection();
      expect(
        screen.getByText("Discover India's Most Loved Brands")
      ).toBeInTheDocument();
    });

    it('renders the Explore Brands CTA linking to BrandsPage', () => {
      renderHeroSection();
      const cta = screen.getByTestId('link-BrandsPage');
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveTextContent('Explore Brands');
    });

    it('renders trust badges', () => {
      renderHeroSection();
      expect(screen.getByText('Ships to All 50 States')).toBeInTheDocument();
      expect(screen.getByText('US Cards Accepted')).toBeInTheDocument();
    });

    it('renders category pills', () => {
      renderHeroSection();
      expect(screen.getByText('Baby & Kids')).toBeInTheDocument();
      expect(screen.getByText('Fashion')).toBeInTheDocument();
      expect(screen.getByText('Home & Kitchen')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('renders skeleton card while brands are loading', () => {
      const { container } = renderHeroSection({ fetchInProgress: true });
      // Skeleton div is present (no brand card)
      expect(container.querySelector('.brandSkeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('brand-hero-card')).not.toBeInTheDocument();
    });

    it('still shows headline during loading', () => {
      renderHeroSection({ fetchInProgress: true });
      expect(
        screen.getByText("Discover India's Most Loved Brands")
      ).toBeInTheDocument();
    });
  });

  describe('Empty state (no hero brands)', () => {
    it('shows headline and CTA with no brand card or carousel', () => {
      renderHeroSection({ heroBrands: [] });
      expect(
        screen.getByText("Discover India's Most Loved Brands")
      ).toBeInTheDocument();
      expect(screen.getByTestId('link-BrandsPage')).toBeInTheDocument();
      expect(screen.queryByTestId('brand-hero-card')).not.toBeInTheDocument();
    });
  });

  describe('Brand carousel', () => {
    it('renders a BrandHeroCard slide for every hero brand in the list', () => {
      renderHeroSection({
        heroBrands: [
          makeHeroBrand('Fizzy Goblet', 'brand-1'),
          makeHeroBrand('Tarinika', 'brand-2'),
          makeHeroBrand('Ankid', 'brand-3'),
        ],
      });

      const cards = screen.getAllByTestId('brand-hero-card');
      expect(cards).toHaveLength(3);
      expect(cards[0]).toHaveAttribute('data-brand-name', 'Fizzy Goblet');
      expect(cards[1]).toHaveAttribute('data-brand-name', 'Tarinika');
      expect(cards[2]).toHaveAttribute('data-brand-name', 'Ankid');
    });

    it('renders a hero brand with zero products (no products dependency)', () => {
      // Proves the fixed architecture gap: BrandHeroCard needs no product
      // data, so a brand entry with no `products` key at all must still
      // render — getHeroBrands never required one.
      renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1')],
      });

      expect(screen.getByTestId('brand-hero-card')).toHaveAttribute(
        'data-brand-name',
        'Fizzy Goblet'
      );
    });

    it('passes the resolved hero image URL map to each card', () => {
      renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1')],
      });

      expect(screen.getByTestId('brand-hero-card')).toHaveAttribute('data-hero-url-count', '1');
    });

    it('marks only the first slide as priority (LCP eager-load)', () => {
      renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1'), makeHeroBrand('Tarinika', 'brand-2')],
      });

      const cards = screen.getAllByTestId('brand-hero-card');
      expect(cards[0]).toHaveAttribute('data-is-priority', 'true');
      expect(cards[1]).toHaveAttribute('data-is-priority', 'false');
    });

    it('renders one dot per visible slide — no dead dots (WCAG 2.2.2 count parity)', () => {
      renderHeroSection({
        heroBrands: [
          makeHeroBrand('Fizzy Goblet', 'brand-1'),
          makeHeroBrand('Tarinika', 'brand-2'),
          makeHeroBrand('Ankid', 'brand-3'),
        ],
      });

      const dots = screen.getAllByRole('button', { name: /View/ });
      expect(dots).toHaveLength(3);
      expect(screen.getAllByTestId('brand-hero-card')).toHaveLength(3);
    });

    it('hides arrows, dots and pause control when only one brand remains', () => {
      const { container } = renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1')],
      });

      expect(container.querySelectorAll('button[aria-label]').length).toBe(0);
    });

    it('renders the pause/play control with multiple brands (WCAG 2.2.2)', () => {
      renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1'), makeHeroBrand('Tarinika', 'brand-2')],
      });

      expect(screen.getByRole('button', { name: /Pause brand rotation/i })).toBeInTheDocument();
    });

    it('navigation dots carry brand name aria-labels', () => {
      renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1'), makeHeroBrand('Tarinika', 'brand-2')],
      });

      expect(screen.getByRole('button', { name: /Fizzy Goblet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tarinika/i })).toBeInTheDocument();
    });

    it('clicking a dot activates that slide and scrolls the track to it', async () => {
      renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1'), makeHeroBrand('Tarinika', 'brand-2')],
      });

      Element.prototype.scrollTo.mockClear();

      const tarinikaDot = screen.getByRole('button', { name: /Tarinika/i });
      await userEvent.click(tarinikaDot);

      await waitFor(() => {
        expect(tarinikaDot.className).toContain('activeDot');
      });
      expect(Element.prototype.scrollTo).toHaveBeenCalled();
    });

    it('labels the track as a carousel with per-slide group labels', () => {
      const { container } = renderHeroSection({
        heroBrands: [makeHeroBrand('Fizzy Goblet', 'brand-1'), makeHeroBrand('Tarinika', 'brand-2')],
      });

      const track = container.querySelector('[aria-roledescription="carousel"]');
      expect(track).toBeInTheDocument();
      expect(screen.getByRole('group', { name: '1 of 2: Fizzy Goblet' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: '2 of 2: Tarinika' })).toBeInTheDocument();
    });
  });
});
