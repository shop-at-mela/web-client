import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

jest.mock('../../../../util/homepageSdk', () => ({
  listings: { query: jest.fn() },
}));

jest.mock('../../../../components', () => ({
  ProductCarousel: ({
    title,
    subtitle,
    listings,
    onItemClick,
    layout,
    showAuthorInfo,
    showVariantCount,
  }) => (
    <div
      data-testid="product-carousel"
      data-show-variant-count={String(showVariantCount)}
      data-layout={layout || 'carousel'}
      data-show-author-info={String(showAuthorInfo)}
    >
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {listings.map(listing => (
        <div
          key={listing.id.uuid}
          data-testid="listing-card"
          onClick={() => onItemClick && onItemClick(listing)}
        >
          {listing.attributes.title}
        </div>
      ))}
    </div>
  ),
}));

// Mutable so each test picks the baked-ids path (non-empty) or the live fallback (empty).
const mockBaked = { ids: [] };
jest.mock('../../../../config/configBrands', () => ({
  get newFromIndiaListingIds() {
    return mockBaked.ids;
  },
}));

jest.mock('../../../../util/data', () => ({
  updatedEntities: jest.fn(),
  denormalisedEntities: jest.fn(),
}));

jest.mock('../../../../util/analytics/homepageEditorial', () => ({
  pushNewFromIndiaClick: jest.fn(),
}));

import NewFromIndia from './NewFromIndia';
import sdk from '../../../../util/homepageSdk';
import { denormalisedEntities } from '../../../../util/data';
import { pushNewFromIndiaClick } from '../../../../util/analytics/homepageEditorial';

const mockMessages = {
  'NewFromIndia.title': 'New from India',
  'NewFromIndia.subtitle': 'Fresh arrivals from the brands we vet',
};

const renderInContext = ui =>
  render(<IntlProvider locale="en" messages={mockMessages}>{ui}</IntlProvider>);

const listing = (id, { author, createdAt } = {}) => ({
  id: { uuid: id },
  type: 'listing',
  attributes: { title: `Product ${id}`, createdAt },
  author: author ? { id: { uuid: author } } : null,
});

describe('NewFromIndia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBaked.ids = [];
    sdk.listings.query.mockResolvedValue({ data: { data: [], included: [] } });
  });

  it('renders the section heading and subtitle', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    renderInContext(<NewFromIndia />);
    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    expect(screen.getByText('New from India')).toBeInTheDocument();
    expect(screen.getByText('Fresh arrivals from the brands we vet')).toBeInTheDocument();
  });

  it('renders as a grid, not a sideways carousel, with the brand name shown', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    renderInContext(<NewFromIndia />);
    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    expect(screen.getByTestId('product-carousel')).toHaveAttribute('data-layout', 'grid');
    expect(screen.getByTestId('product-carousel')).toHaveAttribute('data-show-author-info', 'true');
    expect(screen.getByTestId('product-carousel')).toHaveAttribute(
      'data-show-variant-count',
      'false'
    );
  });

  it('caps the row at 2 products per brand, preserving recency order', async () => {
    denormalisedEntities.mockReturnValue([
      listing('a1', { author: 'brandA' }),
      listing('a2', { author: 'brandA' }),
      listing('a3', { author: 'brandA' }), // 3rd from brandA — should be dropped
      listing('b1', { author: 'brandB' }),
    ]);

    renderInContext(<NewFromIndia />);

    await waitFor(() => {
      const titles = screen.getAllByTestId('listing-card').map(el => el.textContent);
      expect(titles).toEqual(['Product a1', 'Product a2', 'Product b1']);
    });
  });

  it('caps the row at 8 products total', async () => {
    denormalisedEntities.mockReturnValue(
      Array.from({ length: 10 }, (_, i) => listing(`l${i}`, { author: `brand${i}` }))
    );

    renderInContext(<NewFromIndia />);

    await waitFor(() => {
      expect(screen.getAllByTestId('listing-card')).toHaveLength(8);
    });
  });

  it('fires new_from_india_click with brand and product ids on card click', async () => {
    denormalisedEntities.mockReturnValue([listing('l1', { author: 'brandA' })]);
    renderInContext(<NewFromIndia />);

    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('listing-card'));

    expect(pushNewFromIndiaClick).toHaveBeenCalledWith('brandA', 'l1');
  });

  it('renders nothing when there are no recent listings', async () => {
    denormalisedEntities.mockReturnValue([]);
    const { container } = renderInContext(<NewFromIndia />);

    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders nothing when the fetch fails', async () => {
    sdk.listings.query.mockRejectedValue(new Error('network error'));
    const { container } = renderInContext(<NewFromIndia />);

    await waitFor(() => expect(container.firstChild).toBeNull());
  });
  it('falls back to a live query sorted newest first (createdAt, not -createdAt)', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    renderInContext(<NewFromIndia />);
    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    const params = sdk.listings.query.mock.calls[0][0];
    expect(params.sort).toBe('createdAt');
    expect(params.ids).toBeUndefined();
  });

  describe('with baked listing ids', () => {
    const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();
    const ids = ['n1', 'n2', 'n3', 'n4', 'n5'];

    beforeEach(() => {
      mockBaked.ids = ids;
    });

    it('fetches them in one ids query, with no sort', async () => {
      denormalisedEntities.mockReturnValue(
        ids.slice(0, 4).map(id => listing(id, { author: id, createdAt: daysAgo(1) }))
      );
      renderInContext(<NewFromIndia />);
      await waitFor(() => expect(screen.getAllByTestId('listing-card')).toHaveLength(4));
      expect(sdk.listings.query).toHaveBeenCalledTimes(1);
      const params = sdk.listings.query.mock.calls[0][0];
      expect(params.ids).toEqual(ids);
      expect(params.sort).toBeUndefined();
    });

    it('shows them in the baked order even if the API returns another order', async () => {
      denormalisedEntities.mockReturnValue(
        ['n4', 'n2', 'n1', 'n3'].map(id => listing(id, { author: id, createdAt: daysAgo(2) }))
      );
      renderInContext(<NewFromIndia />);
      await waitFor(() => {
        const titles = screen.getAllByTestId('listing-card').map(el => el.textContent);
        expect(titles).toEqual(['Product n1', 'Product n2', 'Product n3', 'Product n4']);
      });
    });

    it('drops listings older than 30 days instead of calling them new', async () => {
      denormalisedEntities.mockReturnValue([
        listing('n1', { author: 'a', createdAt: daysAgo(1) }),
        listing('n2', { author: 'b', createdAt: daysAgo(2) }),
        listing('n3', { author: 'c', createdAt: daysAgo(3) }),
        listing('n4', { author: 'd', createdAt: daysAgo(4) }),
        listing('n5', { author: 'e', createdAt: daysAgo(400) }), // stale
      ]);
      renderInContext(<NewFromIndia />);
      await waitFor(() => expect(screen.getAllByTestId('listing-card')).toHaveLength(4));
      expect(screen.queryByText('Product n5')).toBeNull();
    });

    it('hides the section when fewer than 4 fresh listings remain', async () => {
      denormalisedEntities.mockReturnValue([
        listing('n1', { author: 'a', createdAt: daysAgo(1) }),
        listing('n2', { author: 'b', createdAt: daysAgo(2) }),
        listing('n3', { author: 'c', createdAt: daysAgo(3) }),
        listing('n4', { author: 'd', createdAt: daysAgo(200) }),
      ]);
      const { container } = renderInContext(<NewFromIndia />);
      await waitFor(() => expect(sdk.listings.query).toHaveBeenCalled());
      await waitFor(() => expect(container).toBeEmptyDOMElement());
    });
  });
});
