import React from 'react';
import '@testing-library/jest-dom';

import { getHostedConfiguration, renderWithProviders as render } from '../../util/testHelpers';
import { createUser, createListing, fakeIntl } from '../../util/testData';

import { ListingCard } from './ListingCard';

const getConfig = () => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingTypes: {
      listingTypes: [
        {
          id: 'free-inquiry',
          transactionProcess: {
            name: 'default-inquiry',
            alias: 'default-inquiry/release-1',
          },
          unitType: 'inquiry',
          defaultListingFields: {
            price: false,
          },
        },
      ],
    },
  };
};

describe('ListingCard', () => {
  it('matches snapshot', () => {
    // This is quite small component what comes to rendered HTML
    // For now, we rely on snapshot-testing.
    const listing = createListing('listing1', {}, { author: createUser('user1') });
    const tree = render(<ListingCard listing={listing} intl={fakeIntl} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot without price', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      { publicData: { listingType: 'free-inquiry' } },
      { author: createUser('user1') }
    );
    const tree = render(<ListingCard listing={listing} intl={fakeIntl} />, { config });
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot with trust badges', () => {
    const listing = createListing(
      'listing1',
      {
        publicData: {
          brand: 'Organic Brand',
          certification: ['gots_certified', 'bpa_free'],
        },
      },
      { author: createUser('user1') }
    );
    const tree = render(
      <ListingCard listing={listing} showTrustBadges={true} intl={fakeIntl} />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot with conversion badge (bestseller)', () => {
    const listing = createListing(
      'listing1',
      {
        publicData: {
          brand: 'Popular Brand',
        },
      },
      { author: createUser('user1') }
    );
    const tree = render(
      <ListingCard listing={listing} showConversionBadges={true} isBestseller={true} intl={fakeIntl} />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot with conversion badge (low stock)', () => {
    const listing = createListing(
      'listing1',
      {
        publicData: {
          brand: 'Limited Stock Brand',
        },
      },
      { author: createUser('user1') }
    );
    const tree = render(
      <ListingCard listing={listing} showConversionBadges={true} stockCount={3} intl={fakeIntl} />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot without author info', () => {
    const listing = createListing(
      'listing1',
      {
        publicData: {
          brand: 'Test Brand',
        },
      },
      { author: createUser('user1') }
    );
    const tree = render(<ListingCard listing={listing} showAuthorInfo={false} intl={fakeIntl} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot with all badges and no author', () => {
    const listing = createListing(
      'listing1',
      {
        publicData: {
          brand: 'Premium Brand',
          certification: ['gots_certified', 'non_toxic_dyes'],
        },
      },
      { author: createUser('user1') }
    );
    const tree = render(
      <ListingCard
        listing={listing}
        showAuthorInfo={false}
        showTrustBadges={true}
        showConversionBadges={true}
        isBestseller={true}
        intl={fakeIntl}
      />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  describe('INR equivalent price', () => {
    it('shows INR price when priceInINR is in publicData', () => {
      const listing = createListing(
        'listing1',
        { publicData: { priceInINR: 2499 } },
        { author: createUser('user1') }
      );
      const { getByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(getByText('ListingCard.inrEquivalent')).toBeInTheDocument();
    });

    it('does not show INR price when priceInINR is absent', () => {
      const listing = createListing(
        'listing1',
        { publicData: {} },
        { author: createUser('user1') }
      );
      const { queryByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(queryByText('ListingCard.inrEquivalent')).not.toBeInTheDocument();
    });

    it('does not show INR price when priceInINR is zero', () => {
      const listing = createListing(
        'listing1',
        { publicData: { priceInINR: 0 } },
        { author: createUser('user1') }
      );
      const { queryByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(queryByText('ListingCard.inrEquivalent')).not.toBeInTheDocument();
    });
  });

  describe('variant pill', () => {
    it('shows variant pill when variantCount > 1', () => {
      const listing = createListing(
        'listing1',
        { publicData: { variantCount: 8 } },
        { author: createUser('user1') }
      );
      const { getByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(getByText('8 variants')).toBeInTheDocument();
    });

    it('hides variant pill when variantCount is 1', () => {
      const listing = createListing(
        'listing1',
        { publicData: { variantCount: 1 } },
        { author: createUser('user1') }
      );
      const { queryByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(queryByText(/variants/)).not.toBeInTheDocument();
    });

    it('hides variant pill when variantCount is absent', () => {
      const listing = createListing(
        'listing1',
        { publicData: {} },
        { author: createUser('user1') }
      );
      const { queryByText } = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(queryByText(/variants/)).not.toBeInTheDocument();
    });

    it('matches snapshot with variant pill', () => {
      const listing = createListing(
        'listing1',
        { publicData: { variantCount: 4 } },
        { author: createUser('user1') }
      );
      const tree = render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(tree.asFragment().firstChild).toMatchSnapshot();
    });
  });
});
