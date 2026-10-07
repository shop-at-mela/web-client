import { createIntl } from 'react-intl';
import enMessages from '../translations/en.json';
import {
  getCanonicalProductUrl,
  getListingSchemaTitle,
  getOfferSeller,
  getSeoDescriptionFallback,
} from './productSchema';

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

describe('getListingSchemaTitle', () => {
  const run = args => getListingSchemaTitle(intl, { marketplaceName: 'Mela', ...args });

  it('leads with the product and adds the brand when the title lacks it', () => {
    expect(run({ title: 'Cotton Kurta', brandName: 'Ankid' })).toBe('Cotton Kurta by Ankid | Mela');
  });

  it('does not repeat a brand already in the title, in any case', () => {
    expect(run({ title: 'Glacier Sweatshirt in Light Grey Nicobar', brandName: 'Nicobar' })).toBe(
      'Glacier Sweatshirt in Light Grey Nicobar | Mela'
    );
    expect(run({ title: 'NICOBAR Sweatshirt', brandName: 'Nicobar' })).toBe('NICOBAR Sweatshirt | Mela');
  });

  it('works without a brand', () => {
    expect(run({ title: 'Cotton Kurta' })).toBe('Cotton Kurta | Mela');
    expect(run({ title: 'Cotton Kurta', brandName: '' })).toBe('Cotton Kurta | Mela');
  });

  it('never says authentic, baby or uses a dash separator', () => {
    const title = run({ title: 'Cotton Kurta', brandName: 'Ankid' });
    expect(title).not.toMatch(/authentic|baby|diaspora/i);
    expect(title).not.toMatch(/ [-\u2013\u2014] /);
  });
});
