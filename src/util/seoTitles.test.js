import {
  MAX_TITLE_LENGTH,
  categoryDisplayName,
  humanizeCategorySlug,
  pickTitleThatFits,
} from './seoTitles';

describe('humanizeCategorySlug', () => {
  it.each([
    ['Lighting-Outdoor', 'Lighting & Outdoor'],
    ['Kitchen-Dining', 'Kitchen & Dining'],
    ['Furniture-Storage', 'Furniture & Storage'],
    ['Rugs-Floor-Coverings', 'Rugs & Floor Coverings'],
    ['Some-Long-Slug', 'Some Long Slug'],
    ['Decor', 'Decor'],
    ['Home & Kitchen', 'Home & Kitchen'],
    ['', ''],
    [undefined, ''],
  ])('%s -> %s', (slug, expected) => {
    expect(humanizeCategorySlug(slug)).toBe(expected);
  });
});

describe('categoryDisplayName', () => {
  it('prefers a configured label', () => {
    expect(categoryDisplayName('Lighting & Outdoor', 'Lighting-Outdoor')).toBe('Lighting & Outdoor');
    expect(categoryDisplayName('Decor', 'Decor')).toBe('Decor');
  });

  it('humanizes when the configured name is the raw slug or missing', () => {
    expect(categoryDisplayName('Lighting-Outdoor', 'Lighting-Outdoor')).toBe('Lighting & Outdoor');
    expect(categoryDisplayName(undefined, 'Lighting-Outdoor')).toBe('Lighting & Outdoor');
    expect(categoryDisplayName('', 'Decor')).toBe('Decor');
  });
});

describe('pickTitleThatFits', () => {
  const long = 'Kaunteya | Indian Jewelry & Accessories Brand | Mela and more words here';
  const short = 'Kaunteya | Curated Indian Brand | Mela';

  it('returns the first candidate within the limit', () => {
    expect(pickTitleThatFits(['A | Mela', short])).toBe('A | Mela');
  });

  it('skips overlong and empty candidates', () => {
    expect(long.length).toBeGreaterThan(MAX_TITLE_LENGTH);
    expect(pickTitleThatFits([null, long, short])).toBe(short);
  });

  it('accepts exactly 60 characters', () => {
    const sixty = 'x'.repeat(60);
    expect(pickTitleThatFits([sixty + 'y', sixty])).toBe(sixty);
  });

  it('returns the shortest whole candidate when none fit, never a cut one', () => {
    const a = 'word '.repeat(20).trim();
    const b = 'word '.repeat(15).trim();
    expect(pickTitleThatFits([a, b])).toBe(b);
  });

  it('returns an empty string with no candidates', () => {
    expect(pickTitleThatFits([])).toBe('');
  });
});
