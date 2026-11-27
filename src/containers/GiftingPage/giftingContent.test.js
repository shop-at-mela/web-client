import { isUnknownOccasionSlug, OCCASION_LANDING_CONTENT } from './giftingContent';

describe('isUnknownOccasionSlug', () => {
  const labels = { wedding: 'Wedding', baby_shower: 'Baby Shower' };

  it('treats /gifts (no slug) as known', () => {
    expect(isUnknownOccasionSlug(undefined, labels)).toBe(false);
  });

  it('keeps occasion values and curated slugs as pages', () => {
    expect(isUnknownOccasionSlug('wedding', labels)).toBe(false);
    expect(isUnknownOccasionSlug(Object.keys(OCCASION_LANDING_CONTENT)[0], {})).toBe(false);
  });

  it('flags anything else so the page answers 404', () => {
    expect(isUnknownOccasionSlug('nope', labels)).toBe(true);
    // Object prototype keys are not occasions
    expect(isUnknownOccasionSlug('toString', labels)).toBe(true);
    expect(isUnknownOccasionSlug('constructor', labels)).toBe(true);
  });
});
