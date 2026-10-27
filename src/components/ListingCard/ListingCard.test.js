import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/react';

import { getHostedConfiguration, renderWithProviders as render } from '../../util/testHelpers';
import { createUser, createListing, createImage, fakeIntl } from '../../util/testData';
import { types as sdkTypes } from '../../util/sdkLoader';

import { ListingCard } from './ListingCard';
import { stripTrailingBrand, isSameBrandName } from './ListingCard.helpers';

const { Money } = sdkTypes;

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

  it('renders nothing for a $0 promo SKU (P0.2 trust-debris sweep)', () => {
    const listing = createListing(
      'free-promo',
      { price: new Money(0, 'USD') },
      { author: createUser('user1') }
    );
    const { container } = render(<ListingCard listing={listing} intl={fakeIntl} />);
    expect(container.firstChild).toBeNull();
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

  // Skipped while SHOW_BESTSELLER_BADGE is false in ListingCard.js; un-skip when it is turned back on.
  it.skip('matches snapshot with conversion badge (bestseller)', () => {
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

  // Skipped while SHOW_BESTSELLER_BADGE is false in ListingCard.js; un-skip when it is turned back on.
  it.skip('matches snapshot with all badges and no author', () => {
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

    it('hides variant pill when showVariantCount is false', () => {
      const listing = createListing(
        'listing1',
        { publicData: { variantCount: 3 } },
        { author: createUser('user1') }
      );
      render(<ListingCard listing={listing} intl={fakeIntl} showVariantCount={false} />);
      expect(screen.queryByText('3 variants')).not.toBeInTheDocument();
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

  describe('onShopNow (SavedPage per-card CTA)', () => {
    it('tags trackingParams with saved_surface: saved_item_card (insights/crossshop-tracking-prd.md §14)', () => {
      const listing = createListing(
        'listing1',
        { publicData: { brand: 'Nicobar', productUrl: 'https://nicobar.example/p' } },
        { author: createUser('user1') }
      );
      const onShopNow = jest.fn();
      render(<ListingCard listing={listing} intl={fakeIntl} onShopNow={onShopNow} />);

      fireEvent.click(screen.getByText('ListingCard.shopOnBrand'));

      expect(onShopNow).toHaveBeenCalledTimes(1);
      const call = onShopNow.mock.calls[0][0];
      expect(call.url).toBe('https://nicobar.example/p');
      expect(call.trackingParams).toMatchObject({ savedSurface: 'saved_item_card' });
    });

    it('passes the brand author\'s brandUsShipping to onShopNow (null without it)', () => {
      const usShipping = { duties: 'ddp', method: 'flat_rate', feeUsd: 30 };
      const withData = createListing(
        'listing1',
        { publicData: { brand: 'Nicobar', productUrl: 'https://nicobar.example/p' } },
        {
          author: {
            id: { uuid: 'nicobar-author' },
            attributes: { profile: { publicData: { brandUsShipping: usShipping } } },
          },
        }
      );
      const onShopNow = jest.fn();
      const { unmount } = render(<ListingCard listing={withData} intl={fakeIntl} onShopNow={onShopNow} />);
      fireEvent.click(screen.getByText('ListingCard.shopOnBrand'));
      expect(onShopNow.mock.calls[0][0].usShipping).toEqual(usShipping);
      unmount();

      const noData = createListing(
        'listing2',
        { publicData: { brand: 'Nicobar', productUrl: 'https://nicobar.example/p' } },
        { author: createUser('user1') }
      );
      const onShopNow2 = jest.fn();
      render(<ListingCard listing={noData} intl={fakeIntl} onShopNow={onShopNow2} />);
      fireEvent.click(screen.getByText('ListingCard.shopOnBrand'));
      expect(onShopNow2.mock.calls[0][0].usShipping).toBeNull();
    });
  });

  describe('showCardInfo', () => {
    const bestseller = () =>
      createListing(
        'listing1',
        { title: 'Kutchi Kurta in Yellow Ankid', publicData: { brand: 'Ankid', variantCount: 3 } },
        { author: createUser('user1') }
      );

    it('shows price, title and variants by default', () => {
      const { container } = render(<ListingCard listing={bestseller()} intl={fakeIntl} />);
      expect(container.querySelector('.info')).toBeInTheDocument();
      expect(screen.getByText('Kutchi Kurta in Yellow')).toBeInTheDocument();
      expect(screen.getByText('3 variants')).toBeInTheDocument();
    });

    // Skipped while SHOW_BESTSELLER_BADGE is false in ListingCard.js; un-skip when it is turned back on.
    it.skip('renders an image-only card when false, keeping the badge and save button', () => {
      const { container } = render(
        <ListingCard
          listing={bestseller()}
          intl={fakeIntl}
          showCardInfo={false}
          showConversionBadges={true}
          isBestseller={true}
          showAuthorInfo={true}
        />
      );
      expect(container.querySelector('.info')).not.toBeInTheDocument();
      expect(container.querySelector('.infoLink')).not.toBeInTheDocument();
      expect(screen.queryByText('Kutchi Kurta in Yellow')).not.toBeInTheDocument();
      expect(screen.queryByText('3 variants')).not.toBeInTheDocument();
      expect(container.querySelector('.authorInfo')).not.toBeInTheDocument();
      expect(container.querySelector('.saveButton')).toBeInTheDocument();
      expect(container.querySelector('.conversionBadge, [class*="Badge"]')).toBeInTheDocument();
    });

    it('keeps an accessible name on the image link (the listing title as aria-label)', () => {
      const listing = createListing(
        'listing1',
        { title: 'Kutchi Kurta in Yellow Ankid', publicData: { brand: 'Ankid' } },
        { author: createUser('user1'), images: [createImage('image1')] }
      );
      const { container } = render(
        <ListingCard listing={listing} intl={fakeIntl} showCardInfo={false} />
      );
      const imageLink = container.querySelector('a.imageLink');
      // The <img> itself is lazy-loaded (not rendered in jsdom); its alt also starts with
      // the title (generateListingAltText), but the aria-label guarantees the name.
      expect(imageLink).toHaveAttribute('aria-label', 'Kutchi Kurta in Yellow Ankid');
    });

    it('adds no aria-label to the image link when card info is shown', () => {
      const { container } = render(<ListingCard listing={bestseller()} intl={fakeIntl} />);
      expect(container.querySelector('a.imageLink')).not.toHaveAttribute('aria-label');
    });
  });

  describe('brand name shown once', () => {
    it('strips the trailing brand from the displayed title', () => {
      const listing = createListing(
        'listing1',
        { title: 'Cotton Ulhas Kurta in Yellow Ankid', publicData: { brand: 'Ankid' } },
        { author: createUser('user1') }
      );
      render(<ListingCard listing={listing} intl={fakeIntl} />);
      expect(screen.getByText('Cotton Ulhas Kurta in Yellow')).toBeInTheDocument();
    });

    it('hides the author line when it names the same brand', () => {
      const listing = createListing(
        'listing1',
        { title: 'Loafers for Men Banjaaran Studio', publicData: { brand: 'Banjaaran Studio' } },
        { author: createUser('user1', { profile: { displayName: 'Banjaaran' } }) }
      );
      const { container } = render(
        <ListingCard listing={listing} intl={fakeIntl} showAuthorInfo={true} />
      );
      expect(container.querySelector('.brandName')).toBeInTheDocument();
      expect(container.querySelector('.author')).not.toBeInTheDocument();
    });

    it('shows the author line when it differs from the brand', () => {
      const listing = createListing(
        'listing1',
        { title: 'Romper', publicData: { brand: 'Masilo' } },
        { author: createUser('user1', { profile: { displayName: 'Baby Forest' } }) }
      );
      const { container } = render(
        <ListingCard listing={listing} intl={fakeIntl} showAuthorInfo={true} />
      );
      expect(container.querySelector('.author')).toBeInTheDocument();
    });

    it('shows the author line when there is no brand', () => {
      const listing = createListing('listing1', { title: 'Romper' }, { author: createUser('user1') });
      const { container } = render(
        <ListingCard listing={listing} intl={fakeIntl} showAuthorInfo={true} />
      );
      expect(container.querySelector('.author')).toBeInTheDocument();
    });
  });
});

describe('stripTrailingBrand', () => {
  it.each([
    ['Cotton Ulhas Kurta in Yellow Ankid', 'Ankid', 'Cotton Ulhas Kurta in Yellow'],
    // case differences
    ['Organic Cotton Baby Romper 0-6 Months Masilo', 'masilo', 'Organic Cotton Baby Romper 0-6 Months'],
    ['Bamboo Boy Trunk in Super Sonic 4–6Y SuperBottoms', 'Superbottoms', 'Bamboo Boy Trunk in Super Sonic 4–6Y'],
    // partial names, both directions
    ['Loafers for Men in Coal Black Banjaaran', 'Banjaaran Studio', 'Loafers for Men in Coal Black'],
    ['Loafers for Men in Coal Black Banjaaran Studio', 'Banjaaran', 'Loafers for Men in Coal Black'],
    ['Wild Rose Face Mask Vilvah Store', 'Vilvah Store', 'Wild Rose Face Mask'],
    ['Wild Rose Face Mask Vilvah', 'Vilvah Store', 'Wild Rose Face Mask'],
    // leading "The" and a "by" before the brand
    ['Silk Frock for Girls 3–4Y The Nesavu', 'The Nesavu', 'Silk Frock for Girls 3–4Y'],
    ['Silk Frock for Girls 3–4Y Nesavu', 'The Nesavu', 'Silk Frock for Girls 3–4Y'],
    ['Cushion Cover in Cloud Dancer by Pluchi', 'Pluchi', 'Cushion Cover in Cloud Dancer'],
    ['Handcrafted Potli for Women FS House of Chikankari', 'House Of Chikankari', 'Handcrafted Potli for Women FS'],
    // brand also at the start: only the trailing copy goes
    ['Choose Kind Theo 0–0Y Choose Kind', 'Choose Kind', 'Choose Kind Theo 0–0Y'],
  ])('%s (%s) -> %s', (title, brand, expected) => {
    expect(stripTrailingBrand(title, brand)).toBe(expected);
  });

  it.each([
    // no match
    ['Glacier Sweatshirt for Men', 'Nicobar'],
    // brand in the middle, not at the end
    ['Nicobar Glacier Sweatshirt', 'Nicobar'],
    // brand as part of a longer word
    ['Cotton Doll Ankidland', 'Ankid'],
    // a generic word of the brand alone is not enough ("House" from "House of Chikankari")
    ['Wooden Dolls House', 'House of Chikankari'],
    // the title is only the brand name
    ['Ankid', 'Ankid'],
  ])('leaves "%s" unchanged for brand %s', (title, brand) => {
    expect(stripTrailingBrand(title, brand)).toBe(title);
  });

  it('returns the title unchanged without a brand', () => {
    expect(stripTrailingBrand('Romper Masilo', null)).toBe('Romper Masilo');
    expect(stripTrailingBrand('Romper Masilo', '  ')).toBe('Romper Masilo');
    expect(stripTrailingBrand(undefined, 'Masilo')).toBeUndefined();
  });
});

describe('isSameBrandName', () => {
  it.each([
    ['Banjaaran Studio', 'Banjaaran'],
    ['Vilvah Store', 'Vilvah'],
    ['The Nesavu', 'the nesavu'],
    ['Aagghhoo', 'aagghhoo'],
    ['House Of Chikankari', 'House of Chikankari'],
  ])('%s = %s', (a, b) => expect(isSameBrandName(a, b)).toBe(true));

  it.each([
    ['Masilo', 'Baby Forest'],
    ['Nicobar', null],
  ])('%s != %s', (a, b) => expect(isSameBrandName(a, b)).toBe(false));
});
