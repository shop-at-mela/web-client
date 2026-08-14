import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

jest.mock('../../util/homepageSdk', () => ({
  listings: { query: jest.fn() },
}));

jest.mock('../../components', () => ({
  ProductCarousel: ({ title, subtitle, listings, onItemClick }) => (
    <div>
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

jest.mock('../../util/data', () => ({
  updatedEntities: jest.fn(),
  denormalisedEntities: jest.fn(),
}));

jest.mock('../../util/analytics/savedRecommendations', () => ({
  pushSavedRecommendationClick: jest.fn(),
}));

import SavedPageRecommendations from './SavedPageRecommendations';
import sdk from '../../util/homepageSdk';
import { denormalisedEntities } from '../../util/data';
import { pushSavedRecommendationClick } from '../../util/analytics/savedRecommendations';

const mockMessages = {
  'SavedPageRecommendations.title': 'You might also like',
  'SavedPageRecommendations.subtitle': 'More picks from the brands we vet',
  'SavedPageRecommendations.emptyTitle': 'Popular on Mela',
  'SavedPageRecommendations.emptySubtitle': 'Start your list with what shoppers are saving',
};

const renderInContext = ui =>
  render(<IntlProvider locale="en" messages={mockMessages}>{ui}</IntlProvider>);

const listing = (id, { author } = {}) => ({
  id: { uuid: id },
  type: 'listing',
  attributes: { title: `Product ${id}` },
  author: author ? { id: { uuid: author } } : null,
});

describe('SavedPageRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sdk.listings.query.mockResolvedValue({ data: { data: [], included: [] } });
  });

  it('renders the default title and subtitle', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    renderInContext(<SavedPageRecommendations />);
    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    expect(screen.getByText('You might also like')).toBeInTheDocument();
  });

  it('renders the empty-state title/subtitle when passed', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    renderInContext(
      <SavedPageRecommendations
        titleId="SavedPageRecommendations.emptyTitle"
        subtitleId="SavedPageRecommendations.emptySubtitle"
      />
    );
    await waitFor(() => expect(screen.getByText('Popular on Mela')).toBeInTheDocument());
  });

  it('excludes already-saved listing ids from the rail', async () => {
    denormalisedEntities.mockReturnValue([listing('saved1'), listing('fresh1')]);
    renderInContext(<SavedPageRecommendations excludeIds={['saved1']} />);

    await waitFor(() => {
      const titles = screen.getAllByTestId('listing-card').map(el => el.textContent);
      expect(titles).toEqual(['Product fresh1']);
    });
  });

  it('caps the rail at 2 products per brand, preserving order', async () => {
    denormalisedEntities.mockReturnValue([
      listing('a1', { author: 'brandA' }),
      listing('a2', { author: 'brandA' }),
      listing('a3', { author: 'brandA' }),
      listing('b1', { author: 'brandB' }),
    ]);
    renderInContext(<SavedPageRecommendations />);

    await waitFor(() => {
      const titles = screen.getAllByTestId('listing-card').map(el => el.textContent);
      expect(titles).toEqual(['Product a1', 'Product a2', 'Product b1']);
    });
  });

  it('reports hasItems via onLoaded once the fetch resolves', async () => {
    denormalisedEntities.mockReturnValue([listing('l1')]);
    const onLoaded = jest.fn();
    renderInContext(<SavedPageRecommendations onLoaded={onLoaded} />);

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(true));
  });

  it('reports hasItems=false via onLoaded when the filtered result is empty', async () => {
    denormalisedEntities.mockReturnValue([listing('saved1')]);
    const onLoaded = jest.fn();
    const { container } = renderInContext(
      <SavedPageRecommendations excludeIds={['saved1']} onLoaded={onLoaded} />
    );

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(false));
    expect(container.firstChild).toBeNull();
  });

  it('reports hasItems=false via onLoaded when the fetch fails, and renders nothing', async () => {
    sdk.listings.query.mockRejectedValue(new Error('network error'));
    const onLoaded = jest.fn();
    const { container } = renderInContext(<SavedPageRecommendations onLoaded={onLoaded} />);

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(false));
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no recent listings', async () => {
    denormalisedEntities.mockReturnValue([]);
    const { container } = renderInContext(<SavedPageRecommendations />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('fires saved_recommendation_click with brand and product ids on card click', async () => {
    denormalisedEntities.mockReturnValue([listing('l1', { author: 'brandA' })]);
    renderInContext(<SavedPageRecommendations />);

    await waitFor(() => expect(screen.getByTestId('listing-card')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('listing-card'));

    expect(pushSavedRecommendationClick).toHaveBeenCalledWith('brandA', 'l1');
  });
});
