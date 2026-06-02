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
jest.mock('../../../BrandsPage/BrandsPage.duck', () => ({
  fetchFeaturedBrands: () => ({ type: 'FETCH_FEATURED_BRANDS' }),
  getFeaturedBrandsWithProducts: state => state.BrandsPage?.brandsWithProducts ?? [],
  getFeaturedBrandsInProgress: state => state.BrandsPage?.fetchInProgress ?? false,
  getFeaturedBrandsError: state => state.BrandsPage?.fetchError ?? null,
}));

// Mock BrandCardHome — we test HeroSection's wiring, not BrandCardHome internals
jest.mock('../../../../components/BrandCardHome/BrandCardHome', () => {
  const BrandCardHome = ({ brand, maxProducts, showCta, showCertifications }) => (
    <div
      data-testid="brand-card-home"
      data-brand-name={brand?.attributes?.profile?.displayName}
      data-max-products={maxProducts}
      data-show-cta={String(showCta)}
      data-show-certifications={String(showCertifications)}
    />
  );
  BrandCardHome.displayName = 'BrandCardHome';
  return { __esModule: true, default: BrandCardHome };
});

jest.mock('../../../../components', () => ({
  NamedLink: ({ children, name, className }) => (
    <a data-testid={`link-${name}`} className={className} href={`/${name}`}>
      {children}
    </a>
  ),
  BrandCardHome: require('../../../../components/BrandCardHome/BrandCardHome').default,
}));

import HeroSection from './HeroSection';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeBrandWithProducts = (name, id = `brand-${name}`) => ({
  brand: {
    id: { uuid: id },
    type: 'user',
    attributes: {
      profile: {
        displayName: name,
        bio: `${name} bio.`,
        publicData: { certifications: [] },
      },
    },
  },
  products: [],
});

const mockConfig = {
  marketplaceName: 'Mela',
  categoryConfiguration: { categories: [] },
};

const renderHeroSection = (brandsState = {}) => {
  const defaultBrandsPage = {
    brandsWithProducts: [],
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
        screen.getByText('Independent Indian Brands, Curated for Your Family')
      ).toBeInTheDocument();
    });

    it('renders the subheadline', () => {
      renderHeroSection();
      expect(screen.getByText(/Baby essentials, fashion, home/)).toBeInTheDocument();
    });

    it('renders the Explore Brands CTA linking to BrandsPage', () => {
      renderHeroSection();
      const cta = screen.getByTestId('link-BrandsPage');
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveTextContent('Explore Brands');
    });

    it('renders trust badges', () => {
      renderHeroSection();
      expect(screen.getByText('Hand-Curated Brands')).toBeInTheDocument();
      expect(screen.getByText('Independent Indian Brands')).toBeInTheDocument();
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
      expect(screen.queryByTestId('brand-card-home')).not.toBeInTheDocument();
    });

    it('still shows headline during loading', () => {
      renderHeroSection({ fetchInProgress: true });
      expect(
        screen.getByText('Independent Indian Brands, Curated for Your Family')
      ).toBeInTheDocument();
    });
  });

  describe('Empty state (no brands configured)', () => {
    it('shows headline and CTA with no brand card', () => {
      renderHeroSection({ brandsWithProducts: [] });
      expect(
        screen.getByText('Independent Indian Brands, Curated for Your Family')
      ).toBeInTheDocument();
      expect(screen.getByTestId('link-BrandsPage')).toBeInTheDocument();
      expect(screen.queryByTestId('brand-card-home')).not.toBeInTheDocument();
    });
  });

  describe('Brand carousel', () => {
    it('renders BrandCardHome with the current brand', () => {
      renderHeroSection({
        brandsWithProducts: [makeBrandWithProducts('Masilo')],
      });

      const card = screen.getByTestId('brand-card-home');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-brand-name', 'Masilo');
    });

    it('passes showCta={false} so the card CTA does not compete with Explore Brands', () => {
      renderHeroSection({
        brandsWithProducts: [makeBrandWithProducts('Masilo')],
      });

      expect(screen.getByTestId('brand-card-home')).toHaveAttribute('data-show-cta', 'false');
    });

    it('passes maxProducts={2} to limit hero card to one product row', () => {
      renderHeroSection({
        brandsWithProducts: [makeBrandWithProducts('Masilo')],
      });

      expect(screen.getByTestId('brand-card-home')).toHaveAttribute('data-max-products', '2');
    });

    it('passes showCertifications={false} to keep hero card clean', () => {
      renderHeroSection({
        brandsWithProducts: [makeBrandWithProducts('Masilo')],
      });

      expect(screen.getByTestId('brand-card-home')).toHaveAttribute(
        'data-show-certifications',
        'false'
      );
    });

    it('hides prev/next arrows when only one brand is configured', () => {
      const { container } = renderHeroSection({
        brandsWithProducts: [makeBrandWithProducts('Masilo')],
      });

      // navArrow buttons are display:none on mobile and not rendered when hasMultiple=false
      expect(container.querySelectorAll('button[aria-label]').length).toBe(0);
    });

    it('renders navigation dots when multiple brands are configured', () => {
      renderHeroSection({
        brandsWithProducts: [
          makeBrandWithProducts('Masilo', 'brand-1'),
          makeBrandWithProducts('Ekibeki', 'brand-2'),
          makeBrandWithProducts('Tiber Taber', 'brand-3'),
        ],
      });

      const dots = screen.getAllByRole('button');
      // 3 brand dots + 2 nav arrows
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });

    it('navigation dots carry brand name aria-labels', () => {
      renderHeroSection({
        brandsWithProducts: [
          makeBrandWithProducts('Masilo', 'brand-1'),
          makeBrandWithProducts('Ekibeki', 'brand-2'),
        ],
      });

      expect(screen.getByRole('button', { name: /Masilo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ekibeki/i })).toBeInTheDocument();
    });

    it('clicking a dot switches the displayed brand', async () => {
      renderHeroSection({
        brandsWithProducts: [
          makeBrandWithProducts('Masilo', 'brand-1'),
          makeBrandWithProducts('Ekibeki', 'brand-2'),
        ],
      });

      // Initially shows first brand
      expect(screen.getByTestId('brand-card-home')).toHaveAttribute('data-brand-name', 'Masilo');

      // Click dot for second brand
      const ekibekiDot = screen.getByRole('button', { name: /Ekibeki/i });
      await userEvent.click(ekibekiDot);

      await waitFor(() => {
        expect(screen.getByTestId('brand-card-home')).toHaveAttribute(
          'data-brand-name',
          'Ekibeki'
        );
      });
    });
  });
});
