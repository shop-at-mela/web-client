import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import OccasionCard from './OccasionCard';

// Isolate OccasionCard from the connected ListingCard and routing NamedLink.
jest.mock('../ListingCard/ListingCard', () => ({ listing }) => (
  <div data-testid="listing-card">{listing.id.uuid}</div>
));

jest.mock('../NamedLink/NamedLink', () => ({ name, to, className, children }) => (
  <a data-testid="named-link" data-name={name} data-search={to?.search} className={className}>
    {children}
  </a>
));

// OccasionCard's mobile peek renders the real ProductCarousel — stub it out and
// capture the props OccasionCard passes in, since ProductCarousel's own behavior
// is covered by ProductCarousel.test.js.
jest.mock('../ProductCarousel/ProductCarousel', () => props => (
  <div
    data-testid="product-carousel"
    data-listings-count={props.listings?.length ?? 0}
    data-loading={String(!!props.isLoading)}
    data-min-items={props.minItems}
    data-show-trust-badges={String(!!props.showTrustBadges)}
    data-show-inr-price={String(!!props.showInrPrice)}
  />
));

const listing = uuid => ({ id: { uuid }, attributes: { publicData: {} } });

const baseProps = {
  label: 'Gifting',
  description: 'Curated gifts for baby showers and naming ceremonies.',
  colorTheme: 'gifting',
  ctaLabel: 'Shop Gifts',
  viewAllSearch: '?pub_occasion=has_any:gifting',
};

const renderCard = props => render(<OccasionCard {...baseProps} {...props} />);

describe('OccasionCard', () => {
  it('renders the title, story description, and CTA label', () => {
    renderCard({ products: [listing('a'), listing('b')] });
    expect(screen.getByText('Gifting')).toBeInTheDocument();
    expect(
      screen.getByText('Curated gifts for baby showers and naming ceremonies.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('named-link')).toHaveTextContent('Shop Gifts');
  });

  describe('desktop peek (static grid)', () => {
    it('shows a curated peek of at most two products', () => {
      renderCard({ products: [listing('a'), listing('b'), listing('c'), listing('d')] });
      expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
    });

    it('renders two skeletons (not products) when loading', () => {
      const { container } = renderCard({
        isLoading: true,
        products: [listing('a'), listing('b')],
      });
      expect(container.querySelectorAll('.peekSkeleton')).toHaveLength(2);
      expect(screen.queryByTestId('listing-card')).not.toBeInTheDocument();
    });
  });

  describe('mobile peek (ProductCarousel)', () => {
    it('passes all fetched products through, not just the desktop 2-item peek', () => {
      renderCard({ products: [listing('a'), listing('b'), listing('c'), listing('d')] });
      expect(screen.getByTestId('product-carousel')).toHaveAttribute(
        'data-listings-count',
        '4'
      );
    });

    it('forwards isLoading to the carousel', () => {
      renderCard({ isLoading: true, products: [listing('a'), listing('b')] });
      expect(screen.getByTestId('product-carousel')).toHaveAttribute('data-loading', 'true');
    });

    it('uses the compact, badge-free editorial presentation (no trust badges, no INR price)', () => {
      renderCard({ products: [listing('a'), listing('b')] });
      const carousel = screen.getByTestId('product-carousel');
      expect(carousel).toHaveAttribute('data-show-trust-badges', 'false');
      expect(carousel).toHaveAttribute('data-show-inr-price', 'false');
      expect(carousel).toHaveAttribute('data-min-items', '2');
    });
  });

  it('points the CTA at SearchPage with the occasion query', () => {
    renderCard({ products: [listing('a'), listing('b')] });
    const link = screen.getByTestId('named-link');
    expect(link).toHaveAttribute('data-name', 'SearchPage');
    expect(link).toHaveAttribute('data-search', '?pub_occasion=has_any:gifting');
  });

  it('applies the gifting (indigo) color theme', () => {
    const { container } = renderCard({ colorTheme: 'gifting', products: [] });
    expect(container.querySelector('.gifting')).toBeInTheDocument();
    expect(container.querySelector('.festive')).not.toBeInTheDocument();
  });

  it('applies the festive (marigold) color theme', () => {
    const { container } = renderCard({ colorTheme: 'festive', products: [] });
    expect(container.querySelector('.festive')).toBeInTheDocument();
    expect(container.querySelector('.gifting')).not.toBeInTheDocument();
  });

  it('renders a gradient editorial header and scrim', () => {
    const { container } = renderCard({ products: [] });
    expect(container.querySelector('.editorial .bg')).toBeInTheDocument();
    expect(container.querySelector('.editorial .scrim')).toBeInTheDocument();
  });
});
