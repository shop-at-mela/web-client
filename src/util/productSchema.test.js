import { createIntl } from 'react-intl';
import enMessages from '../translations/en.json';
import { getCanonicalProductUrl, getOfferSeller, getSeoDescriptionFallback } from './productSchema';

const intl = createIntl({ locale: 'en', messages: enMessages });

describe('getOfferSeller', () => {
  it('is the brand as an Organization', () => {
    expect(getOfferSeller('Nicobar')).toEqual({ '@type': 'Organization', name: 'Nicobar' });
  });

  it('adds the brand store url when it is an http(s) url', () => {
    expect(getOfferSeller('Nicobar', 'https://global.nicobar.com')).toEqual({
      '@type': 'Organization',
      name: 'Nicobar',
      url: 'https://global.nicobar.com',
    });
  });

  it.each([[undefined], [null], [''], ['javascript:alert(1)'], ['nicobar.com'], [42]])(
    'ignores an unusable store url (%p)',
    url => {
      expect(getOfferSeller('Nicobar', url)).toEqual({ '@type': 'Organization', name: 'Nicobar' });
    }
  );

  it.each([[undefined], [null], ['']])('asserts no seller without a brand name (%p)', brand => {
    expect(getOfferSeller(brand, 'https://global.nicobar.com')).toBeUndefined();
  });
});

describe('getSeoDescriptionFallback', () => {
  it('names the product, brand and marketplace', () => {
    expect(
      getSeoDescriptionFallback(intl, {
        title: 'Cotton Kurta',
        brandName: 'Nicobar',
        description: 'A soft cotton kurta.',
        marketplaceName: 'Mela',
      })
    ).toBe('Cotton Kurta by Nicobar, curated on Mela. A soft cotton kurta.');
  });

  it('works without a brand', () => {
    expect(
      getSeoDescriptionFallback(intl, {
        title: 'Cotton Kurta',
        description: 'A soft cotton kurta.',
        marketplaceName: 'Mela',
      })
    ).toBe('Cotton Kurta, curated on Mela. A soft cotton kurta.');
  });

  it('has no trailing space without a description', () => {
    expect(
      getSeoDescriptionFallback(intl, { title: 'Cotton Kurta', brandName: 'Nicobar', marketplaceName: 'Mela' })
    ).toBe('Cotton Kurta by Nicobar, curated on Mela.');
  });

  it('cuts the description snippet at 100 characters and the whole text at 160', () => {
    const long = 'x'.repeat(500);
    const result = getSeoDescriptionFallback(intl, {
      title: 'T'.repeat(80),
      brandName: 'Nicobar',
      description: long,
      marketplaceName: 'Mela',
    });
    expect(result.length).toBe(160);
  });

  it('makes no audience, delivery or authenticity claim', () => {
    const text = getSeoDescriptionFallback(intl, {
      title: 'Cotton Kurta',
      brandName: 'Nicobar',
      description: 'Soft.',
      marketplaceName: 'Mela',
    });
    expect(text).not.toMatch(/diaspora|delivered|authentic|trusted/i);
  });
});

describe('getCanonicalProductUrl', () => {
  it('is the root plus the path', () => {
    expect(getCanonicalProductUrl('https://shopatmela.com', '/l/cotton-kurta/abc')).toBe(
      'https://shopatmela.com/l/cotton-kurta/abc'
    );
  });
});
