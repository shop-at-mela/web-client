import { normalizeEntrySource, captureEntrySource, getEntrySource, stripUtmParams } from './entrySource';

const ENTRY_SOURCE_KEY = 'mela_entry_source';

describe('normalizeEntrySource(params)', () => {
  it('returns the raw utm_source when medium is organic social', () => {
    expect(
      normalizeEntrySource({
        utmSource: 'pinterest',
        utmMedium: 'social',
        utmCampaign: 'superbottoms_w2',
        referrer: '',
      })
    ).toEqual('pinterest');
  });

  it('lowercases utm_source', () => {
    expect(
      normalizeEntrySource({ utmSource: 'Instagram', utmMedium: null, utmCampaign: null, referrer: '' })
    ).toEqual('instagram');
  });

  it('derives brand_ad:{slug} from utm_campaign when medium is paid', () => {
    expect(
      normalizeEntrySource({
        utmSource: 'instagram',
        utmMedium: 'paid_social',
        utmCampaign: 'superbottoms_w2',
        referrer: '',
      })
    ).toEqual('brand_ad:superbottoms');
  });

  it('recognizes cpc as a paid medium too', () => {
    expect(
      normalizeEntrySource({
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'nicobar_w5',
        referrer: '',
      })
    ).toEqual('brand_ad:nicobar');
  });

  it('falls back to raw utm_source when paid medium has no campaign', () => {
    expect(
      normalizeEntrySource({ utmSource: 'instagram', utmMedium: 'paid_social', utmCampaign: null, referrer: '' })
    ).toEqual('instagram');
  });

  it('classifies a Pinterest referrer with no UTM params', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://www.pinterest.com/pin/123',
      })
    ).toEqual('pinterest');
  });

  it('classifies a search engine referrer as seo', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://www.google.com/search?q=indian+baby+brands',
      })
    ).toEqual('seo');
  });

  it('classifies a Yahoo search referrer as seo, even though it comes from the search. subdomain', () => {
    // Regression guard: an earlier proposed fix (switching to host.startsWith()) would have
    // broken this, since Yahoo's real search-results referrer is search.yahoo.com, not bare
    // yahoo.com. See crossshop-tracking-prd.md §13 for the dev-lead review that caught this.
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://search.yahoo.com/search?p=indian+baby+brands',
      })
    ).toEqual('seo');
  });

  it('does not classify Google Tag Manager\'s own debugging tool as seo', () => {
    // The actual bug this exclusion list fixes: found via our own GTM Preview testing traffic.
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://tagassistant.google.com/some-debug-path',
      })
    ).toEqual('tagassistant.google.com');
  });

  it('does not classify other known Google product subdomains as seo', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://accounts.google.com/signin',
      })
    ).toEqual('accounts.google.com');
  });

  it('classifies Perplexity as ai_search, distinct from seo', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://www.perplexity.ai/search?q=indian+baby+brands',
      })
    ).toEqual('ai_search');
  });

  it('classifies Google Bard/Gemini as ai_search, not seo, even though the hostname contains google.', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://bard.google.com/chat/abc123',
      })
    ).toEqual('ai_search');
  });

  it('classifies a Bing referrer as seo, not ai_search, since ChatGPT citations are indistinguishable from real Bing search at the hostname level', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://www.bing.com/search?q=indian+baby+brands',
      })
    ).toEqual('seo');
  });

  it('passes through an unrecognized referrer host rather than dropping the signal', () => {
    expect(
      normalizeEntrySource({
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrer: 'https://someblog.example.com/post',
      })
    ).toEqual('someblog.example.com');
  });

  it('returns direct when there is no utm_source and no referrer', () => {
    expect(
      normalizeEntrySource({ utmSource: null, utmMedium: null, utmCampaign: null, referrer: '' })
    ).toEqual('direct');
  });

  it('returns direct for a malformed referrer URL', () => {
    expect(
      normalizeEntrySource({ utmSource: null, utmMedium: null, utmCampaign: null, referrer: 'not-a-url' })
    ).toEqual('direct');
  });
});

describe('captureEntrySource() + getEntrySource()', () => {
  const setLocation = (search, referrer) => {
    window.history.pushState({}, '', `/${search}`);
    Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
  };

  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('persists the normalized entry_source on first capture', () => {
    setLocation('?utm_source=pinterest&utm_medium=social', '');
    captureEntrySource();
    expect(getEntrySource()).toEqual('pinterest');
  });

  it('never overwrites an already-persisted entry_source', () => {
    window.sessionStorage.setItem(ENTRY_SOURCE_KEY, 'direct');
    setLocation('?utm_source=pinterest', '');
    captureEntrySource();
    expect(getEntrySource()).toEqual('direct');
  });

  it('getEntrySource defaults to direct when nothing was ever captured', () => {
    expect(getEntrySource()).toEqual('direct');
  });
});

describe('stripUtmParams()', () => {
  it('removes utm_* params via replaceState without touching other query params', () => {
    window.history.pushState({}, '', '/gifts?utm_source=pinterest&utm_medium=social&pub_recipient=has_any%3Afor_mom');
    stripUtmParams();
    expect(window.location.search).toEqual('?pub_recipient=has_any%3Afor_mom');
    expect(window.location.pathname).toEqual('/gifts');
  });

  it('preserves the hash', () => {
    window.history.pushState({}, '', '/gifts?utm_source=instagram#section');
    stripUtmParams();
    expect(window.location.search).toEqual('');
    expect(window.location.hash).toEqual('#section');
  });

  it('no-ops when there are no utm params', () => {
    window.history.pushState({}, '', '/gifts?pub_recipient=has_any%3Afor_mom');
    stripUtmParams();
    expect(window.location.search).toEqual('?pub_recipient=has_any%3Afor_mom');
  });
});
