import React from 'react';
import '@testing-library/jest-dom';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import SavedListingButton from './SavedListingButton';

const { screen, fireEvent } = testingLibrary;

describe('SavedListingButton', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.localStorage.clear();
  });

  const renderButton = props =>
    render(<SavedListingButton listingId="listing-1" listingData={{ title: 'T' }} {...props} />, {
      initialState: {
        auth: { isAuthenticated: false },
        savedListings: { savedListingIds: [], anonSavedItems: [], toggleInProgress: {} },
      },
    });

  it('tags the saved_listing_toggle event with the brand duties type', () => {
    renderButton({ variant: 'cta', source: 'add_to_cart_button', dutiesType: 'ddu' });
    fireEvent.click(screen.getByRole('button'));
    expect(window.dataLayer[0]).toMatchObject({
      event: 'saved_listing_toggle',
      save_source: 'add_to_cart_button',
      listing_id: 'listing-1',
      duties_type: 'ddu',
    });
  });

  it('sends duties_type null when no brand profile is available', () => {
    renderButton({ variant: 'icon' });
    fireEvent.click(screen.getByRole('button'));
    expect(window.dataLayer[0]).toHaveProperty('duties_type', null);
  });
});
