import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { HelmetProvider } from 'react-helmet-async';

import configureStore from '../../store';
import { createListing } from '../../util/testData';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';
import {
  getDefaultConfiguration,
  getHostedConfiguration,
  getRouteConfiguration,
} from '../../util/testHelpers';
import { mergeConfig } from '../../util/configHelpers';

import SavedPage from './SavedPage';

// Topbar/Footer/ListingCard are already covered by their own unit tests —
// stub them here so SavedPage tests stay focused on SavedPage's own logic.
jest.mock('../TopbarContainer/TopbarContainer', () => () => <div data-testid="topbar" />);
jest.mock('../FooterContainer/FooterContainer', () => () => <div data-testid="footer" />);
jest.mock('../../components/ListingCard/ListingCard', () => props => (
  <div data-testid="listing-card">{props.listing.attributes.title}</div>
));

const mockMessages = {
  'SavedPage.title': 'Saved',
  'SavedPage.subheading': 'Your personal Mela collection — meri pasand ❤️',
  'SavedPage.emptyHeading': 'Nothing saved yet',
  'SavedPage.emptySubheading': 'your meri pasand waits ❤️',
  'SavedPage.emptyBrowseCta': 'Browse products',
  'SavedPage.loading': 'Loading your saved items…',
  'SavedPage.error': 'Could not load saved items. Please try again.',
  'SavedPage.schemaTitle': 'Saved Items | Mela',
  'SavedPage.schemaDescription': 'Your saved items on Mela.',
  'Page.schemaTitle': '{marketplaceName}',
  'Page.schemaDescription': 'Marketplace',
};

const mockConfig = mergeConfig(getHostedConfiguration(), getDefaultConfiguration());
const mockRoutes = getRouteConfiguration();

const baseSavedListingsState = {
  savedListingIds: [],
  toggleInProgress: {},
  toggleError: null,
  fetchInProgress: false,
  fetchError: null,
  anonSavedItems: [],
};

const buildState = (savedListingsOverrides = {}, entities = {}) => ({
  savedListings: { ...baseSavedListingsState, ...savedListingsOverrides },
  marketplaceData: { entities: { listing: {}, ...entities } },
});

// Fetch effect only fires when savedListingIds is non-empty (see SavedPage.js),
// so a no-op sdk is enough for tests that keep the ids list empty.
const noopSdk = { listings: { query: () => new Promise(() => {}) } };

const renderSavedPage = (initialState, sdk = noopSdk) => {
  const store = configureStore({ initialState, sdk });
  return render(
    <HelmetProvider>
      <Provider store={store}>
        <MemoryRouter>
          <IntlProvider locale="en" messages={mockMessages}>
            <ConfigurationProvider value={mockConfig}>
              <RouteConfigurationProvider value={mockRoutes}>
                <SavedPage />
              </RouteConfigurationProvider>
            </ConfigurationProvider>
          </IntlProvider>
        </MemoryRouter>
      </Provider>
    </HelmetProvider>
  );
};

describe('SavedPage', () => {
  it('always renders the Mela header (Topbar) and footer', () => {
    renderSavedPage(buildState());
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders the page title and subheading', () => {
    renderSavedPage(buildState());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Saved');
    expect(screen.getByText(mockMessages['SavedPage.subheading'])).toBeInTheDocument();
  });

  it('shows the empty state with a browse CTA when nothing is saved', () => {
    renderSavedPage(buildState());
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
    const cta = screen.getByText('Browse products');
    expect(cta.closest('a')).toHaveAttribute('href', '/s');
  });

  it('shows a loading state while fetching and no listings are loaded yet', () => {
    // sdk.listings.query never resolves, so fetchInProgress stays true for the assertion.
    renderSavedPage(buildState({ savedListingIds: ['listing1'], fetchInProgress: true }));
    expect(screen.getByText('Loading your saved items…')).toBeInTheDocument();
    expect(screen.queryByText('Nothing saved yet')).not.toBeInTheDocument();
  });

  it('shows an error message when fetching saved listings fails', async () => {
    const failingSdk = { listings: { query: () => Promise.reject(new Error('boom')) } };
    renderSavedPage(buildState({ savedListingIds: ['listing1'] }), failingSdk);
    expect(
      await screen.findByText('Could not load saved items. Please try again.')
    ).toBeInTheDocument();
  });

  it('renders a card for each saved listing once loaded', () => {
    const listing1 = createListing('listing1', { title: 'Buransh Red Jhabla' });
    const listing2 = createListing('listing2', { title: 'Marigold Romper' });

    renderSavedPage(
      buildState(
        { savedListingIds: ['listing1', 'listing2'] },
        { listing: { listing1, listing2 } }
      )
    );

    const cards = screen.getAllByTestId('listing-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Buransh Red Jhabla')).toBeInTheDocument();
    expect(screen.getByText('Marigold Romper')).toBeInTheDocument();
    expect(screen.queryByText('Nothing saved yet')).not.toBeInTheDocument();
  });
});
