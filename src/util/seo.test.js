import { openGraphMetaProps } from './seo';

const baseData = {
  socialSharingTitle: 'Title',
  socialSharingDescription: 'Desc',
  url: 'https://example.com/l/x',
  locale: 'en',
  facebookImages: [{ url: 'https://example.com/img.jpg', width: 1200, height: 630 }],
};

describe('openGraphMetaProps', () => {
  it('returns [] and warns when required fields are missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(openGraphMetaProps({})).toEqual([]);
    warnSpy.mockRestore();
  });

  it('defaults og:type to the given openGraphType without product tags', () => {
    const meta = openGraphMetaProps({ ...baseData, openGraphType: 'website' });
    expect(meta).toContainEqual({ property: 'og:type', content: 'website' });
    expect(meta.find(m => m.property === 'product:price:amount')).toBeUndefined();
    expect(meta.find(m => m.property === 'og:availability')).toBeUndefined();
  });

  it('emits Pinterest product tags when openGraphType is product and price is present', () => {
    const meta = openGraphMetaProps({
      ...baseData,
      openGraphType: 'product',
      productPriceAmount: '22.94',
      productPriceCurrency: 'USD',
      productAvailability: 'instock',
    });
    expect(meta).toContainEqual({ property: 'og:type', content: 'product' });
    expect(meta).toContainEqual({ property: 'product:price:amount', content: '22.94' });
    expect(meta).toContainEqual({ property: 'product:price:currency', content: 'USD' });
    expect(meta).toContainEqual({ property: 'og:availability', content: 'instock' });
  });

  it('omits product tags when openGraphType is product but price data is missing', () => {
    const meta = openGraphMetaProps({ ...baseData, openGraphType: 'product' });
    expect(meta).toContainEqual({ property: 'og:type', content: 'product' });
    expect(meta.find(m => m.property === 'product:price:amount')).toBeUndefined();
    expect(meta.find(m => m.property === 'product:price:currency')).toBeUndefined();
    expect(meta.find(m => m.property === 'og:availability')).toBeUndefined();
  });

  it('omits og:availability when productAvailability is not provided', () => {
    const meta = openGraphMetaProps({
      ...baseData,
      openGraphType: 'product',
      productPriceAmount: '10.00',
      productPriceCurrency: 'USD',
    });
    expect(meta).toContainEqual({ property: 'product:price:amount', content: '10.00' });
    expect(meta.find(m => m.property === 'og:availability')).toBeUndefined();
  });

  it('never emits product tags for non-product page types even if price data is passed', () => {
    const meta = openGraphMetaProps({
      ...baseData,
      openGraphType: 'website',
      productPriceAmount: '10.00',
      productPriceCurrency: 'USD',
      productAvailability: 'instock',
    });
    expect(meta.find(m => m.property === 'product:price:amount')).toBeUndefined();
    expect(meta.find(m => m.property === 'og:availability')).toBeUndefined();
  });
});
