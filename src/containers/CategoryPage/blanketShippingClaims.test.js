import enMessages from '../../translations/en.json';
import { CATEGORY_CONTENT } from './CategoryPage';
import {
  getGiftingContent,
  DEFAULT_GIFTING_CONTENT,
  OCCASION_LANDING_CONTENT,
} from '../GiftingPage/giftingContent';

// Mela is a curated directory: brands ship, Mela does not. No page may say every brand ships to
// the US (not true while a brand has no US shipping), and meta copy must not promise it.
const BLANKET = /shipped to the US|shipping to the US|ships to the US|ship to the US|accepts US cards/i;

const collectStrings = value =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
    ? Object.values(value).flatMap(collectStrings)
    : [];

describe('no blanket shipping claims in page copy', () => {
  it('category page content', () => {
    collectStrings(CATEGORY_CONTENT).forEach(text => expect(text).not.toMatch(BLANKET));
  });

  it('gifting page content, curated and generated', () => {
    collectStrings(DEFAULT_GIFTING_CONTENT).forEach(text => expect(text).not.toMatch(BLANKET));
    collectStrings(OCCASION_LANDING_CONTENT).forEach(text => expect(text).not.toMatch(BLANKET));
    collectStrings(getGiftingContent('some-new-occasion', slug => slug)).forEach(text =>
      expect(text).not.toMatch(BLANKET)
    );
  });

  it.each(['CategoryPage.description', 'BrandsPage.description'])('%s', key => {
    expect(enMessages[key]).not.toMatch(BLANKET);
    expect(enMessages[key]).toMatch(/directly on each brand's own store/);
  });

  it('gifting copy has no dash characters', () => {
    collectStrings(OCCASION_LANDING_CONTENT).forEach(text => expect(text).not.toMatch(/[–—]/));
  });
});
