import { CATEGORY_CONTENT, CATEGORY_CONTENT_LAST_UPDATED } from './CategoryPage';

// GEO regression guard (added 2026-09-25): a Zavi answer-engine audit found category
// pages had no self-contained 40+ word passage in the first third of the page — AI
// answer engines need a block of prose long enough to quote on its own. This test
// keeps a future copy edit from silently shrinking CATEGORY_CONTENT back under that
// bar. It does not (and cannot) verify the copy is still factually current — see
// homepage-faq-geo-signals-prd.md / seo-aeo-category-brand-pages-prd.md for the
// scheduled review process that covers that.

const wordCount = text => text.trim().split(/\s+/).length;

describe('CATEGORY_CONTENT (GEO)', () => {
  const entries = Object.entries(CATEGORY_CONTENT);

  it('has at least one entry', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s: description is a self-contained 40+ word passage', (key, content) => {
    expect(wordCount(content.description)).toBeGreaterThanOrEqual(40);
  });

  it.each(entries)('%s: has a non-empty question-form FAQ heading', (key, content) => {
    expect(content.faqQuestion.trim().length).toBeGreaterThan(0);
    expect(content.faqQuestion.trim().endsWith('?')).toBe(true);
  });

  it.each(entries)('%s: FAQ answer is a substantive, self-contained passage', (key, content) => {
    expect(wordCount(content.faqAnswer)).toBeGreaterThanOrEqual(15);
  });

  it('has a "root" entry for the /categories index page', () => {
    expect(CATEGORY_CONTENT.root).toBeDefined();
  });

  it('CATEGORY_CONTENT_LAST_UPDATED is a valid ISO date string', () => {
    expect(CATEGORY_CONTENT_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(CATEGORY_CONTENT_LAST_UPDATED).getTime())).toBe(false);
  });
});
