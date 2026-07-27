import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

jest.mock('../../../../util/homepageSdk', () => ({
  listings: { query: jest.fn() },
}));

jest.mock('../../../../components', () => ({
  ListingCard: ({ listing }) => (
    <div data-testid="listing-card">{listing.attributes.title}</div>
  ),
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
    sdk.listings.query.mockResolvedValue({ data: { data: [], included: [] } });
  });

  it('renders the section heading and subtitle', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    renderInContext(<NewFromIndia />);
    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    expect(screen.getByText('New from India')).toBeInTheDocument();
    expect(screen.getByText('Fresh arrivals from the brands we vet')).toBeInTheDocument();
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
});
