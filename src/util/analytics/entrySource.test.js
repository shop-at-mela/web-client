import { normalizeEntrySource, captureEntrySource, getEntrySource } from './entrySource';

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
