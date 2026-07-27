import {
  isUtilityItem,
  capConsecutiveBrandRuns,
  applyCategoryMerchandising,
} from './categoryMerchandising';

const listing = (id, { author, price } = {}) => ({
  id: { uuid: id },
  author: author ? { id: { uuid: author } } : undefined,
  attributes: { price: price ? { amount: price, currency: 'USD' } : undefined },
});

describe('isUtilityItem', () => {
  it('flags listings priced below the threshold', () => {
    expect(isUtilityItem(listing('l1', { price: 300 }))).toBe(true); // $3
  });

  it('does not flag listings priced at or above the threshold', () => {
    expect(isUtilityItem(listing('l1', { price: 2500 }))).toBe(false); // $25
    expect(isUtilityItem(listing('l1', { price: 8000 }))).toBe(false); // $80
  });

  it('does not flag listings with no price (inquiry/negotiation)', () => {
    expect(isUtilityItem(listing('l1', {}))).toBe(false);
  });

  it('does not flag $0 promo SKUs as utility items (they are excluded elsewhere, not demoted)', () => {
    expect(isUtilityItem(listing('l1', { price: 0 }))).toBe(false);
  });
});

describe('capConsecutiveBrandRuns', () => {
  it('returns items unchanged when no brand exceeds the cap', () => {
    const items = [
      listing('l1', { author: 'a' }),
      listing('l2', { author: 'b' }),
      listing('l3', { author: 'a' }),
    ];
    const result = capConsecutiveBrandRuns(items, i => i.author.id.uuid, 4);
    expect(result.map(i => i.id.uuid)).toEqual(['l1', 'l2', 'l3']);
  });

  it('caps a dominant brand at maxRun consecutive cards, interleaving others', () => {
    const items = [
      ...Array.from({ length: 8 }, (_, i) => listing(`a${i}`, { author: 'brandA' })),
      listing('b1', { author: 'brandB' }),
      listing('c1', { author: 'brandC' }),
    ];

    const result = capConsecutiveBrandRuns(items, i => i.author.id.uuid, 4);

    // No run of brandA longer than 4 anywhere in the result.
    let maxRun = 0;
    let currentRun = 0;
    let lastBrand = null;
    result.forEach(item => {
      const brand = item.author.id.uuid;
      currentRun = brand === lastBrand ? currentRun + 1 : 1;
      lastBrand = brand;
      maxRun = Math.max(maxRun, currentRun);
    });
    expect(maxRun).toBeLessThanOrEqual(4);

    // Nothing was dropped.
    expect(result).toHaveLength(items.length);
  });

  it('falls through and continues the single remaining brand rather than stalling', () => {
    const items = Array.from({ length: 6 }, (_, i) => listing(`a${i}`, { author: 'onlyBrand' }));
    const result = capConsecutiveBrandRuns(items, i => i.author.id.uuid, 4);
    expect(result).toHaveLength(6);
  });

  it('preserves each brand’s own relative order', () => {
    const items = [
      listing('a1', { author: 'brandA' }),
      listing('b1', { author: 'brandB' }),
      listing('a2', { author: 'brandA' }),
      listing('b2', { author: 'brandB' }),
    ];
    const result = capConsecutiveBrandRuns(items, i => i.author.id.uuid, 1);
    const brandAOrder = result.filter(i => i.author.id.uuid === 'brandA').map(i => i.id.uuid);
    expect(brandAOrder).toEqual(['a1', 'a2']);
  });
});

describe('applyCategoryMerchandising', () => {
  it('demotes utility-priced items below full-priced ones, then applies the diversity cap', () => {
    const items = [
      listing('cheap1', { author: 'brandA', price: 300 }),
      listing('hero1', { author: 'brandA', price: 8000 }),
      listing('cheap2', { author: 'brandB', price: 500 }),
      listing('hero2', { author: 'brandB', price: 9000 }),
    ];

    const result = applyCategoryMerchandising(items, 4);
    const heroIndex = result.findIndex(i => i.id.uuid === 'hero1');
    const cheapIndex = result.findIndex(i => i.id.uuid === 'cheap1');
    expect(heroIndex).toBeLessThan(cheapIndex);
  });

  it('returns an empty array for empty input', () => {
    expect(applyCategoryMerchandising([])).toEqual([]);
  });
});
