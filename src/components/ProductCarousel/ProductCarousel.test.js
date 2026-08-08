import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

jest.mock('../../routing/routeConfiguration', () => []);

jest.mock('../../components', () => ({
  NamedLink: ({ children, className }) => <a className={className}>{children}</a>,
  ListingCard: ({
    listing,
    isBestseller,
    showAuthorInfo,
    showTrustBadges,
    showConversionBadges,
    renderSizes,
  }) => (
    <div
      data-testid="listing-card"
      data-id={listing?.id?.uuid}
      data-is-bestseller={String(!!isBestseller)}
      data-show-author-info={String(!!showAuthorInfo)}
      data-show-trust-badges={String(!!showTrustBadges)}
      data-show-conversion-badges={String(!!showConversionBadges)}
      data-render-sizes={renderSizes}
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

    it('renders the subtitle when provided', () => {
      renderCarousel({
        listings: [makeListing('a'), makeListing('b')],
        subtitle: 'Test subtitle',
      });
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('omits the subtitle when not provided', () => {
      const { container } = renderCarousel({ listings: [makeListing('a'), makeListing('b')] });
      expect(container.querySelector('p')).not.toBeInTheDocument();
    });

    it('omits the header entirely when neither title nor viewAllLinkName is provided', () => {
      const { container } = renderCarousel({
        title: undefined,
        listings: [makeListing('a'), makeListing('b')],
      });
      expect(container.querySelector('h3')).not.toBeInTheDocument();
      // No stray empty heading — the header wrapper itself is skipped, not just its text.
      expect(screen.queryByText('Test Carousel')).not.toBeInTheDocument();
    });

    it('still renders just the View All link when title is omitted but viewAllLinkName is set', () => {
      renderCarousel({
        title: undefined,
        listings: [makeListing('a'), makeListing('b')],
        viewAllLinkName: 'SearchPage',
        viewAllLinkSearch: '?foo=bar',
      });
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.getByText(/View All/i)).toBeInTheDocument();
    });
  });

  describe('renderSizes', () => {
    it('defaults to the full-width carousel image size hint', () => {
      renderCarousel({ listings: [makeListing('a'), makeListing('b')] });
      const card = screen.getAllByTestId('listing-card')[0];
      expect(card).toHaveAttribute(
        'data-render-sizes',
        '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw'
      );
    });

    it('forwards a custom renderSizes hint for narrower host containers', () => {
      renderCarousel({
        listings: [makeListing('a'), makeListing('b')],
        renderSizes: '(max-width: 767px) 45vw, 200px',
      });
      const card = screen.getAllByTestId('listing-card')[0];
      expect(card).toHaveAttribute('data-render-sizes', '(max-width: 767px) 45vw, 200px');
    });
  });

  describe('content flags', () => {
    it('defaults to badges-on, author-off for the catalog carousel presentation', () => {
      renderCarousel({ listings: [makeListing('a'), makeListing('b')] });

      const card = screen.getAllByTestId('listing-card')[0];
      expect(card).toHaveAttribute('data-show-author-info', 'false');
      expect(card).toHaveAttribute('data-show-trust-badges', 'true');
      expect(card).toHaveAttribute('data-show-conversion-badges', 'true');
    });

    it('allows callers to opt into author-on, badges-off (e.g. editorial modules)', () => {
      renderCarousel({
        listings: [makeListing('a'), makeListing('b')],
        showAuthorInfo: true,
        showTrustBadges: false,
        showConversionBadges: false,
      });

      const card = screen.getAllByTestId('listing-card')[0];
      expect(card).toHaveAttribute('data-show-author-info', 'true');
      expect(card).toHaveAttribute('data-show-trust-badges', 'false');
      expect(card).toHaveAttribute('data-show-conversion-badges', 'false');
    });
  });

  describe('onItemClick', () => {
    it('fires onItemClick with the listing when a card is clicked', () => {
      const onItemClick = jest.fn();
      const listings = [makeListing('a'), makeListing('b')];
      renderCarousel({ listings, onItemClick });

      // Click bubbles from the ListingCard mock up to the .card wrapper's onClick.
      screen.getAllByTestId('listing-card')[1].click();

      expect(onItemClick).toHaveBeenCalledWith(listings[1]);
    });

    it('does not error when no onItemClick is provided and a card is clicked', () => {
      const listings = [makeListing('a'), makeListing('b')];
      renderCarousel({ listings });

      expect(() => screen.getAllByTestId('listing-card')[0].click()).not.toThrow();
    });
  });
});
