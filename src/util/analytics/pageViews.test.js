import React from 'react';
import { render } from '@testing-library/react';
import { pushListingView, pushBrandPageView, useListingView, useBrandPageView } from './pageViews';

const listing = (uuid, extra = {}) => ({
  id: { uuid },
  author: { id: { uuid: 'author-1' } },
  attributes: {
    publicData: { brand: 'Kaunteya', categoryLevel1: 'Home', categoryLevel2: 'Kitchen', ...extra },
  },
});

const ListingProbe = ({ listing: l }) => {
  useListingView(l);
  return null;
};
const BrandProbe = ({ user }) => {
  useBrandPageView(user);
  return null;
};

describe('page view events', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.sessionStorage.clear();
  });

  it('pushListingView pushes all fields, null for missing, with a session id', () => {
    pushListingView({ listingId: 'l1', brandName: 'Kaunteya' });
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      event: 'listing_view',
      listing_id: 'l1',
      brand_id: null,
      brand_name: 'Kaunteya',
      category: null,
    });
    expect(window.dataLayer[0].mela_session_id.length).toBeGreaterThan(0);
  });

  it('pushBrandPageView pushes brand fields', () => {
    pushBrandPageView({ brandId: 'b1', brandName: 'Fizzy Goblet' });
    expect(window.dataLayer[0]).toMatchObject({
      event: 'brand_page_view',
      brand_id: 'b1',
      brand_name: 'Fizzy Goblet',
    });
  });

  it('useListingView fires once after load, using most specific category and author id', () => {
    const { rerender } = render(<ListingProbe listing={{}} />);
    expect(window.dataLayer).toHaveLength(0);

    rerender(<ListingProbe listing={listing('l1')} />);
    rerender(<ListingProbe listing={listing('l1')} />);
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      listing_id: 'l1',
      brand_id: 'author-1',
      brand_name: 'Kaunteya',
      category: 'Kitchen',
    });
  });

  it('useListingView fires again for a different listing', () => {
    const { rerender } = render(<ListingProbe listing={listing('l1')} />);
    rerender(<ListingProbe listing={listing('l2')} />);
    expect(window.dataLayer.map(e => e.listing_id)).toEqual(['l1', 'l2']);
  });

  it('useBrandPageView fires once per brand and not while loading', () => {
    const user = id => ({ id: { uuid: id }, attributes: { profile: { displayName: 'Brand' } } });
    const { rerender } = render(<BrandProbe user={undefined} />);
    expect(window.dataLayer).toHaveLength(0);
    rerender(<BrandProbe user={user('b1')} />);
    rerender(<BrandProbe user={user('b1')} />);
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({ brand_id: 'b1', brand_name: 'Brand' });
  });
});
