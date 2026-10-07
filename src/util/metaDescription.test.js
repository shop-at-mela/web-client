import { toMetaDescription } from './metaDescription';

describe('toMetaDescription', () => {
  it('returns short text untouched', () => {
    expect(toMetaDescription('Short one.')).toBe('Short one.');
  });

  it('keeps whole sentences up to the limit', () => {
    const text = 'First sentence is here. Second sentence follows it. Third sentence is far too long to fit within the limit set.';
    expect(toMetaDescription(text, 60)).toBe('First sentence is here. Second sentence follows it.');
  });

  it('cuts at a word boundary when the first sentence alone is too long', () => {
    const text = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen.';
    const result = toMetaDescription(text, 30);
    expect(result).toBe('One two three four five six');
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('never exceeds the limit and adds no ellipsis', () => {
    const long = 'Word '.repeat(200);
    const result = toMetaDescription(long, 155);
    expect(result.length).toBeLessThanOrEqual(155);
    expect(result).not.toMatch(/…|\.\.\./);
  });

  it('collapses whitespace and handles empty input', () => {
    expect(toMetaDescription('  A   b\n c.  ')).toBe('A b c.');
    expect(toMetaDescription(null)).toBe('');
    expect(toMetaDescription(undefined)).toBe('');
  });

  it('does not split on abbreviations without a following space', () => {
    expect(toMetaDescription('Price is 4.5 stars and more. Next.', 40)).toBe('Price is 4.5 stars and more. Next.');
  });
});
