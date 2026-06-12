import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

jest.mock('../../routing/routeConfiguration', () => []);

jest.mock('../../components', () => ({
  NamedLink: ({ children, className }) => <a className={className}>{children}</a>,
  ListingCard: ({ listing, isBestseller }) => (
    <div
      data-testid="listing-card"
      data-id={listing?.id?.uuid}
      data-is-bestseller={String(!!isBestseller)}
    />
  ),
}));

import ProductCarousel from './ProductCarousel';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeListing = (id, { isBestseller = false } = {}) => ({
  id: { uuid: id },
  type: 'listing',
  attributes: {
    title: `Product ${id}`,
    publicData: { isBestseller },
  },
  images: [{ id: { uuid: `img-${id}` } }],
});

const renderCarousel = (props = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{}}>
        <ProductCarousel title="Test Carousel" {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProductCarousel', () => {
  describe('isBestseller badge', () => {
    it('passes isBestseller=true only when publicData.isBestseller is true', () => {
      const listings = [
        makeListing('a', { isBestseller: false }),
        makeListing('b', { isBestseller: true }),
        makeListing('c', { isBestseller: false }),
      ];
      renderCarousel({ listings });

      const cards = screen.getAllByTestId('listing-card');
      expect(cards[0]).toHaveAttribute('data-is-bestseller', 'false');
      expect(cards[1]).toHaveAttribute('data-is-bestseller', 'true');
      expect(cards[2]).toHaveAttribute('data-is-bestseller', 'false');
    });

    it('does not mark the first-position listing as bestseller based on index alone', () => {
      const listings = [makeListing('a'), makeListing('b'), makeListing('c')];
      renderCarousel({ listings });

      screen.getAllByTestId('listing-card').forEach(card => {
        expect(card).toHaveAttribute('data-is-bestseller', 'false');
      });
    });

    it('passes isBestseller=false when publicData.isBestseller is explicitly false', () => {
      const listings = [
        makeListing('a', { isBestseller: false }),
        makeListing('b', { isBestseller: false }),
      ];
      renderCarousel({ listings });

      screen.getAllByTestId('listing-card').forEach(card => {
        expect(card).toHaveAttribute('data-is-bestseller', 'false');
      });
    });

    it('passes isBestseller=false when publicData.isBestseller is absent', () => {
      const listing = {
        id: { uuid: 'x' },
        type: 'listing',
        attributes: { title: 'No flag', publicData: {} },
        images: [{ id: { uuid: 'img-x' } }],
      };
      renderCarousel({ listings: [listing, makeListing('y')] });

      expect(screen.getAllByTestId('listing-card')[0]).toHaveAttribute(
        'data-is-bestseller',
        'false'
      );
    });
  });

  describe('visibility', () => {
    it('renders nothing when fewer than minItems listings have images', () => {
      const { container } = renderCarousel({ listings: [makeListing('a')] });
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when listings array is empty', () => {
      const { container } = renderCarousel({ listings: [] });
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when no listings have images', () => {
      const noImageListings = [
        { id: { uuid: 'a' }, attributes: { title: 'A', publicData: {} }, images: [] },
        { id: { uuid: 'b' }, attributes: { title: 'B', publicData: {} }, images: [] },
      ];
      const { container } = renderCarousel({ listings: noImageListings });
      expect(container.firstChild).toBeNull();
    });

    it('renders when at least minItems listings have images', () => {
      renderCarousel({ listings: [makeListing('a'), makeListing('b')] });
      expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
    });

    it('renders loading skeleton when isLoading is true', () => {
      const { container } = renderCarousel({ listings: [], isLoading: true });
      expect(container.querySelector('.skeleton')).toBeInTheDocument();
    });
  });

  describe('header', () => {
    it('renders the carousel title', () => {
      renderCarousel({ listings: [makeListing('a'), makeListing('b')] });
      expect(screen.getByText('Test Carousel')).toBeInTheDocument();
    });

    it('renders the View All link when viewAllLinkName is provided', () => {
      renderCarousel({
        listings: [makeListing('a'), makeListing('b')],
        viewAllLinkName: 'SearchPage',
        viewAllLinkSearch: '?foo=bar',
      });
      expect(screen.getByText(/View All/i)).toBeInTheDocument();
    });

    it('omits the View All link when viewAllLinkName is not provided', () => {
      renderCarousel({ listings: [makeListing('a'), makeListing('b')] });
      expect(screen.queryByText(/View All/i)).not.toBeInTheDocument();
    });
  });
});
