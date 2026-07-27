import { pushBrandClickout, openBrandStorefront } from './brandClickout';

describe('pushBrandClickout(params)', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.sessionStorage.clear();
  });

  it('pushes a brand_clickout event with all provided params', () => {
    window.sessionStorage.setItem('mela_entry_source', 'pinterest');

    pushBrandClickout({
      brandName: 'SuperBottoms',
      brandId: 'author-uuid-123',
      category: 'Baby-Kids',
      productId: 'listing-uuid-456',
      destination: 'https://superbottoms.com/products/foo',
    });

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      event: 'brand_clickout',
      brand_name: 'SuperBottoms',
      brand_id: 'author-uuid-123',
      category: 'Baby-Kids',
      product_id: 'listing-uuid-456',
      entry_source: 'pinterest',
      destination: 'https://superbottoms.com/products/foo',
    });
    // session_id is generated (not caller-supplied) — assert it's present and non-empty
    // rather than exact-matching an unpredictable UUID. See PRD §13.0 for why this
    // field exists (GA4 blocks registering its own ga_session_id as a custom dimension).
    expect(typeof window.dataLayer[0].session_id).toBe('string');
    expect(window.dataLayer[0].session_id.length).toBeGreaterThan(0);
  });

  it('reuses the same session_id across multiple pushes in the same session', () => {
    pushBrandClickout({ brandName: 'Nicobar' });
    pushBrandClickout({ brandName: 'SuperBottoms' });

    expect(window.dataLayer[0].session_id).toEqual(window.dataLayer[1].session_id);
  });

  it('fills missing params with null rather than omitting the key', () => {
    pushBrandClickout({});

    expect(window.dataLayer[0]).toMatchObject({
      event: 'brand_clickout',
      brand_name: null,
      brand_id: null,
      category: null,
      product_id: null,
      destination: null,
    });
  });

  it('does not throw when called with no arguments', () => {
    expect(() => pushBrandClickout()).not.toThrow();
    expect(window.dataLayer).toHaveLength(1);
  });
});

describe('openBrandStorefront(url, trackingParams)', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.open = jest.fn();
  });

  it('pushes brand_clickout with destination set from the url, then opens the url in a new tab', () => {
    openBrandStorefront('https://brand.example.com/product', { brandName: 'Nicobar' });

    expect(window.dataLayer[0]).toMatchObject({
      event: 'brand_clickout',
      brand_name: 'Nicobar',
      destination: 'https://brand.example.com/product',
    });
    expect(window.open).toHaveBeenCalledWith(
      'https://brand.example.com/product',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not throw when trackingParams is null (e.g. RedirectTrustSheet state not yet set)', () => {
    expect(() => openBrandStorefront('https://brand.example.com/product', null)).not.toThrow();
    expect(window.open).toHaveBeenCalled();
  });
});
