import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import BrandOccasionModule from './BrandOccasionModule';

// Mock the components barrel — keeps tests free of deep rendering deps.
jest.mock('../../components', () => ({
  NamedLink: ({ children, name, to, className }) => (
    <a data-testid={`link-${name}`} href={(to && to.search) || '#'} className={className}>
      {children}
    </a>
  ),
  ListingCard: ({ listing }) => (
    <div data-testid="listing-card" data-id={listing?.id?.uuid}>
      {listing?.attributes?.title}
    </div>
  ),
}));

// Mock CategoryShowcase so occasion copy is fixed and isDiwaliSeason is controllable.
// Also avoids CategoryShowcase's real module-level SDK instantiation running in tests.
jest.mock('../MelaHomePage/sections/CategoryShowcase/CategoryShowcase', () => ({
  OCCASIONS: [
    {
      option: 'diwali-festivals',
      label: 'Diwali & Festivals',
      cta: 'Shop Festive Wear',
      ctaSeasonal: 'Shop for Diwali',
      colorTheme: 'festive',
    },
    {
      option: 'gifting',
      label: 'Gifting',
      cta: 'Shop Gifts',
      ctaSeasonal: null,
      colorTheme: 'gifting',
    },
  ],
  isDiwaliSeason: jest.fn(() => false),
}));

import { isDiwaliSeason } from '../MelaHomePage/sections/CategoryShowcase/CategoryShowcase';

const makeListing = (id, occasionTag) => ({
  id: { uuid: id },
  type: 'listing',
  attributes: {
    title: `Product ${id}`,
    publicData: occasionTag ? { occasion: occasionTag } : {},
  },
});

const renderInContext = ui =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{}}>
        {ui}
      </IntlProvider>
    </MemoryRouter>
  );

describe('BrandOccasionModule', () => {
  beforeEach(() => {
    isDiwaliSeason.mockReturnValue(false);
  });

  it('renders nothing when the brand has no occasion-tagged listings', () => {
    const { container } = renderInContext(
      <BrandOccasionModule listings={[makeListing('1', null)]} brandUserId="u1" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when listings prop is omitted', () => {
    const { container } = renderInContext(<BrandOccasionModule brandUserId="u1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only 1 listing matches an occasion (below the 2-item threshold)', () => {
    const listings = [makeListing('1', 'gifting')];
    const { container } = renderInContext(
      <BrandOccasionModule listings={listings} brandUserId="u1" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders only the qualifying panel when one occasion has ≥2 and the other has none', () => {
    const listings = [makeListing('1', 'gifting'), makeListing('2', 'gifting')];
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="u1" />);

    expect(screen.getByText('Gifting')).toBeInTheDocument();
    expect(screen.queryByText('Diwali & Festivals')).not.toBeInTheDocument();
  });

  it('renders both panels when both occasions qualify', () => {
    const listings = [
      makeListing('1', 'gifting'),
      makeListing('2', 'gifting'),
      makeListing('3', 'diwali-festivals'),
      makeListing('4', 'diwali-festivals'),
    ];
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="u1" />);

    expect(screen.getByText('Gifting')).toBeInTheDocument();
    expect(screen.getByText('Diwali & Festivals')).toBeInTheDocument();
  });

  it('caps a panel at 6 products even when more of the brand catalog qualifies', () => {
    const listings = Array.from({ length: 8 }, (_, i) => makeListing(`p${i}`, 'gifting'));
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="u1" />);

    expect(screen.getAllByTestId('listing-card')).toHaveLength(6);
  });

  it('honors the legacy bare-string occasion format, not just arrays', () => {
    const listing = makeListing('1', 'gifting'); // publicData.occasion === 'gifting' (string)
    const listings = [listing, makeListing('2', 'gifting')];
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="u1" />);

    expect(screen.getByText('Gifting')).toBeInTheDocument();
  });

  it('scopes the panel CTA to both the occasion and this brand', () => {
    const listings = [makeListing('1', 'gifting'), makeListing('2', 'gifting')];
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="brand-123" />);

    const link = screen.getByTestId('link-SearchPage');
    expect(link.getAttribute('href')).toContain('pub_occasion=has_any%3Agifting');
    expect(link.getAttribute('href')).toContain('author_id=brand-123');
  });

  it('omits author_id from the CTA when brandUserId is not provided', () => {
    const listings = [makeListing('1', 'gifting'), makeListing('2', 'gifting')];
    renderInContext(<BrandOccasionModule listings={listings} />);

    const link = screen.getByTestId('link-SearchPage');
    expect(link.getAttribute('href')).not.toContain('author_id');
  });

  it('orders Gifting before Diwali & Festivals outside Diwali season', () => {
    isDiwaliSeason.mockReturnValue(false);
    const listings = [
      makeListing('1', 'gifting'),
      makeListing('2', 'gifting'),
      makeListing('3', 'diwali-festivals'),
      makeListing('4', 'diwali-festivals'),
    ];
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="u1" />);

    const titles = screen.getAllByRole('heading', { level: 4 }).map(el => el.textContent);
    expect(titles).toEqual(['Gifting', 'Diwali & Festivals']);
  });

  it('orders Diwali & Festivals first during Diwali season', () => {
    isDiwaliSeason.mockReturnValue(true);
    const listings = [
      makeListing('1', 'gifting'),
      makeListing('2', 'gifting'),
      makeListing('3', 'diwali-festivals'),
      makeListing('4', 'diwali-festivals'),
    ];
    renderInContext(<BrandOccasionModule listings={listings} brandUserId="u1" />);

    const titles = screen.getAllByRole('heading', { level: 4 }).map(el => el.textContent);
    expect(titles).toEqual(['Diwali & Festivals', 'Gifting']);
  });
});
