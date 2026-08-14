import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import { types as sdkTypes } from '../../util/sdkLoader';
import { createListing, createStock } from '../../util/testData';

import SavedBrandGroup from './SavedBrandGroup';

const { Money } = sdkTypes;

// ListingCard is covered by its own unit tests — stub it here so these tests stay
// focused on SavedBrandGroup's own grouping/subtotal/CTA logic, same pattern as
// SavedPage.test.js.
jest.mock('../../components', () => ({
  ListingCard: props => (
    <div data-testid="listing-card">
      {props.listing.attributes.title}
      {props.onShopNow && (
        <button
          type="button"
          onClick={e =>
            props.onShopNow({
              url: props.listing.attributes.publicData.productUrl,
              brandName: props.listing.attributes.publicData.brand,
              isVerified: false,
              trackingParams: {},
              triggerElement: e.currentTarget,
            })
          }
        >
          Card shop CTA
        </button>
      )}
    </div>
  ),
}));

const mockMessages = {
  'SavedBrandGroup.moreSaved': 'More saved',
  'SavedBrandGroup.itemCount': '{count} items',
  'SavedBrandGroup.shopBrandCta': 'Shop {brandName} →',
};

const renderGroup = props =>
  render(
    <IntlProvider locale="en" messages={mockMessages}>
      <SavedBrandGroup onShopNow={jest.fn()} {...props} />
    </IntlProvider>
  );

const listingWithBrand = (id, { brand = 'Nicobar', price, stock, productUrl = 'https://nicobar.example/p' } = {}) =>
  createListing(
    id,
    {
      title: `${id} title`,
      publicData: { brand, productUrl },
      ...(price !== undefined ? { price } : {}),
    },
    {
      author: { id: { uuid: `${brand}-author` } },
      ...(stock !== undefined ? { currentStock: createStock(`${id}-stock`, { quantity: stock }) } : {}),
    }
  );

describe('SavedBrandGroup', () => {
  it('renders the brand name as a real heading with an item count', () => {
    renderGroup({ brandName: 'Nicobar', listings: [listingWithBrand('l1'), listingWithBrand('l2')] });
    expect(screen.getByRole('heading', { level: 2, name: 'Nicobar' })).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getAllByTestId('listing-card')).toHaveLength(2);
  });

  it('renders "More saved" for the no-brand group', () => {
    renderGroup({ brandName: null, listings: [listingWithBrand('l1', { brand: null })] });
    expect(screen.getByRole('heading', { level: 2, name: 'More saved' })).toBeInTheDocument();
  });

  it('shows a summed subtotal when every item shares one currency', () => {
    renderGroup({
      brandName: 'Nicobar',
      listings: [
        listingWithBrand('l1', { price: new Money(1000, 'USD') }),
        listingWithBrand('l2', { price: new Money(2500, 'USD') }),
      ],
    });
    expect(screen.getByText('$35')).toBeInTheDocument();
  });

  it('suppresses the subtotal when currencies differ', () => {
    renderGroup({
      brandName: 'Nicobar',
      listings: [
        listingWithBrand('l1', { price: new Money(1000, 'USD') }),
        listingWithBrand('l2', { price: new Money(1000, 'EUR') }),
      ],
    });
    expect(screen.queryByText(/\$|€/)).not.toBeInTheDocument();
  });

  it('suppresses the subtotal when any item has no price', () => {
    renderGroup({
      brandName: 'Nicobar',
      listings: [listingWithBrand('l1', { price: new Money(1000, 'USD') }), listingWithBrand('l2', { price: null })],
    });
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('omits the group CTA when no item in the group is shoppable', () => {
    renderGroup({
      brandName: 'Nicobar',
      listings: [listingWithBrand('l1', { brand: 'Nicobar', productUrl: null })],
    });
    expect(screen.queryByTestId('saved-brand-group-shop-cta')).not.toBeInTheDocument();
  });

  it('omits the group CTA when every item is out of stock', () => {
    renderGroup({
      brandName: 'Nicobar',
      listings: [listingWithBrand('l1', { stock: 0 })],
    });
    expect(screen.queryByTestId('saved-brand-group-shop-cta')).not.toBeInTheDocument();
  });

  it('fires onShopNow with the first in-stock item and saved_brand_group tracking on the group CTA', () => {
    const onShopNow = jest.fn();
    renderGroup({
      onShopNow,
      brandName: 'Nicobar',
      listings: [
        listingWithBrand('outOfStock', { stock: 0 }),
        listingWithBrand('inStock', { stock: 5, productUrl: 'https://nicobar.example/in-stock' }),
      ],
    });

    const groupCta = screen.getByTestId('saved-brand-group-shop-cta');
    expect(groupCta).toHaveTextContent('Shop Nicobar →');
    fireEvent.click(groupCta);

    expect(onShopNow).toHaveBeenCalledTimes(1);
    const call = onShopNow.mock.calls[0][0];
    expect(call.url).toBe('https://nicobar.example/in-stock');
    expect(call.brandName).toBe('Nicobar');
    expect(call.trackingParams.savedSurface).toBe('saved_brand_group');
    expect(call.triggerElement).toBeInstanceOf(HTMLElement);
  });

  it('never shows a group CTA for the no-brand "More saved" group', () => {
    renderGroup({
      brandName: null,
      listings: [listingWithBrand('l1', { brand: null, productUrl: 'https://example.com' })],
    });
    expect(screen.queryByTestId('saved-brand-group-shop-cta')).not.toBeInTheDocument();
  });
});
