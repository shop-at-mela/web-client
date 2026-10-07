import enMessages from './en.json';

// Positioning cleanup (Stage 2b): "Indian brand discovery for everyone". Shopper facing and meta
// copy no longer says "authentic", defaults to baby, or addresses the diaspora, and every
// string fits a phone: titles near 60 characters, descriptions carry their point in the first
// 120 characters.
const KEYS = [
  'Page.schemaDescription',
  'LandingPage.schemaDescription',
  'ValueProposition.default.title',
  'ValueProposition.default.subtitle',
  'ValueProposition.provider.subtitle',
  'UserTypeSelector.customer.description',
  'TopbarMobileMenu.heroSubtitle',
  'SavedPage.schemaDescription',
  'SignupPage.schemaTitle',
  'ProfilePage.brandSchemaDescription',
  'ListingPage.schemaTitleWithBrand',
  'ListingPage.schemaTitleNoBrand',
  'ListingPage.seoDescriptionWithBrand',
  'ListingPage.seoDescriptionNoBrand',
];

describe('positioning copy', () => {
  it.each(KEYS)('%s exists', key => {
    expect(typeof enMessages[key]).toBe('string');
  });

  it.each(KEYS)('%s has no legacy positioning words or dash characters', key => {
    const value = enMessages[key];
    expect(value).not.toMatch(/authentic/i);
    expect(value).not.toMatch(/diaspora/i);
    expect(value).not.toMatch(/\bbab(y|ies)\b/i);
    expect(value).not.toMatch(/[-–—]/);
  });

  it.each(['Page.schemaDescription', 'LandingPage.schemaDescription'])(
    '%s fits 120 characters, the length phones show',
    key => {
      expect(enMessages[key].length).toBeLessThanOrEqual(120);
    }
  );

  it('the two site wide descriptions are identical', () => {
    expect(enMessages['LandingPage.schemaDescription']).toBe(enMessages['Page.schemaDescription']);
  });

  it('the default description makes no shipping or duty claim', () => {
    expect(enMessages['Page.schemaDescription']).not.toMatch(/ship|deliver|duty|duties/i);
  });

  it('removed unused keys stay removed', () => {
    expect(enMessages['BrandProfilePage.title']).toBeUndefined();
    expect(enMessages['TopbarMobileMenu.partnerTagline']).toBeUndefined();
  });

  it('the mobile signup title is not the template leftover', () => {
    expect(enMessages['SignupPage.schemaTitle']).toBe('Sign up | {marketplaceName}');
  });
});
