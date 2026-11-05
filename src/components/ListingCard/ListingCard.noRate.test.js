import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../util/testHelpers';
import { createUser, createListing, fakeIntl } from '../../util/testData';
import { types as sdkTypes } from '../../util/sdkLoader';

import { ListingCard } from './ListingCard';

const { Money } = sdkTypes;

// In its own file because the rate is module state, and here it must never have been seeded.
describe('ListingCard with no live rate', () => {
  const listing = createListing(
    'listing1',
    { price: new Money(3011, 'USD'), publicData: { priceInINR: 2499 } },
    { author: createUser('user1') }
  );

  it('shows only the INR price, not the stored USD price', () => {
    const { container, queryByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
    const price = container.querySelector('.price');
    expect(price).toHaveAttribute('title', '2499');
    expect(container.innerHTML).not.toMatch(/3011|30\.11/);
    expect(queryByText('ListingCard.inrEquivalent')).not.toBeInTheDocument();
  });
});
