import { pinterestAvailability, priceForSchemaMaybe } from './ListingPage.shared';
import { types as sdkTypes } from '../../util/sdkLoader';

const { Money } = sdkTypes;

describe('pinterestAvailability', () => {
  it('maps schema.org InStock to Pinterest "instock"', () => {
    expect(pinterestAvailability('https://schema.org/InStock')).toBe('instock');
  });

  it('maps schema.org OutOfStock to Pinterest "out of stock"', () => {
    expect(pinterestAvailability('https://schema.org/OutOfStock')).toBe('out of stock');
  });

  it('returns undefined for unknown or missing availability values', () => {
    expect(pinterestAvailability(undefined)).toBeUndefined();
    expect(pinterestAvailability(null)).toBeUndefined();
    expect(pinterestAvailability('https://schema.org/PreOrder')).toBeUndefined();
  });
});

describe('priceForSchemaMaybe', () => {
  it('returns price and currency for a valid Money object', () => {
    const price = new Money(2294, 'USD');
    expect(priceForSchemaMaybe(price)).toEqual({ price: '22.94', priceCurrency: 'USD' });
  });

  it('returns {} when price is missing or invalid', () => {
    expect(priceForSchemaMaybe(undefined)).toEqual({});
    expect(priceForSchemaMaybe(null)).toEqual({});
  });
});
