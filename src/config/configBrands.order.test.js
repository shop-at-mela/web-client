// Brand config is chosen by REACT_APP_ENV at module load (production map is empty),
// so force the populated map before requiring the module.
process.env.REACT_APP_ENV = 'test';
const {
  getAllBrandSlugs,
  getBrandIdBySlug,
  CURATED_BRAND_SLUG_ORDER,
  FLAGSHIP_BRAND_SLUGS,
} = require('./configBrands');

describe('curated brand order', () => {
  it('lists every public brand, so a newly onboarded brand cannot be left past the featured top 10', () => {
    const missing = getAllBrandSlugs().filter(slug => !CURATED_BRAND_SLUG_ORDER.includes(slug));
    expect(missing).toEqual([]);
  });

  it('lists no brand that is not in the directory (e.g. a delisted brand)', () => {
    const stale = CURATED_BRAND_SLUG_ORDER.filter(slug => !getBrandIdBySlug(slug));
    expect(stale).toEqual([]);
  });

  it('has no duplicates', () => {
    expect(new Set(CURATED_BRAND_SLUG_ORDER).size).toBe(CURATED_BRAND_SLUG_ORDER.length);
  });
});

describe('flagship brands', () => {
  it('only names brands that exist in the directory', () => {
    FLAGSHIP_BRAND_SLUGS.forEach(slug => expect(getBrandIdBySlug(slug)).toBeTruthy());
  });
});
