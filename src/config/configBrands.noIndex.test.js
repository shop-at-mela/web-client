// Brand config is chosen by REACT_APP_ENV at module load (production map is empty),
// so force the populated map before requiring the module.
process.env.REACT_APP_ENV = 'test';
const { getAllBrandSlugs, getBrandIdBySlug, isBrandNoIndex } = require('./configBrands');

describe('brand noIndex flag (temporary, Pluchi pending delist)', () => {
  it('flags Pluchi as noIndex but keeps it configured', () => {
    expect(getBrandIdBySlug('pluchi')).toBeTruthy();
    expect(isBrandNoIndex('pluchi')).toBe(true);
  });

  it('does not flag other brands or unknown slugs', () => {
    expect(isBrandNoIndex('masilo')).toBe(false);
    expect(isBrandNoIndex('does-not-exist')).toBe(false);
    expect(isBrandNoIndex(undefined)).toBe(false);
  });

  it('getAllBrandSlugs skips noIndex brands only', () => {
    const slugs = getAllBrandSlugs();
    expect(slugs).not.toContain('pluchi');
    expect(slugs).toContain('masilo');
  });
});
