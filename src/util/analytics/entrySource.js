/**
 * entrySource.js
 *
 * Captures a normalized, first-touch entry source for the cross-shop/mutualization
 * analysis (see mela-docs/product/prds/crossshop-tracking-prd.md). Written once per
 * browser session and never overwritten — this is what makes entry-vs-exit brand
 * attribution possible downstream in GA4.
 *
 * captureEntrySource() is called once from src/index.js, which only runs on a full
 * page load (not on in-app SPA navigation), so "call once per load" is naturally
 * "call once per session, on the first page."
 */

const ENTRY_SOURCE_KEY = 'mela_entry_source';

const SEARCH_ENGINE_HOSTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.'];
const SOCIAL_HOSTS = {
  'pinterest.': 'pinterest',
  'instagram.': 'instagram',
  'reddit.': 'reddit',
  'facebook.': 'facebook',
  'tiktok.': 'tiktok',
};

/**
 * utm_medium values that mark a *paid*, brand-specific campaign, as opposed to the
 * organic `utm_medium=social` convention already documented in
 * mela-docs/social/category-routing.yaml. No paid campaigns exist yet (see
 * cold-start-checklist.md — "don't pay for ads" is the Week 3 guardrail), so this
 * list is a proposal, not an observed convention — confirm before relying on it.
 */
const PAID_MEDIUMS = ['paid_social', 'cpc'];

const hostFromReferrer = referrer => {
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const classifyReferrer = referrer => {
  if (!referrer) return 'direct';
  const host = hostFromReferrer(referrer);
  if (!host) return 'direct';

  const matchedSocial = Object.entries(SOCIAL_HOSTS).find(([needle]) => host.includes(needle));
  if (matchedSocial) return matchedSocial[1];

  if (SEARCH_ENGINE_HOSTS.some(needle => host.includes(needle))) return 'seo';

  // Unrecognized referrer — pass through the bare host rather than losing the signal.
  return host;
};

/**
 * @param {object} params
 * @param {string|null} params.utmSource
 * @param {string|null} params.utmMedium
 * @param {string|null} params.utmCampaign
 * @param {string} params.referrer
 * @returns {string} normalized entry_source, e.g. "pinterest", "seo", "brand_ad:superbottoms", "direct"
 */
export const normalizeEntrySource = ({ utmSource, utmMedium, utmCampaign, referrer }) => {
  if (utmSource) {
    const source = utmSource.toLowerCase();
    if (utmCampaign && PAID_MEDIUMS.includes((utmMedium || '').toLowerCase())) {
      // utm_campaign schema is `{brand_slug}_w{week}` per category-routing.yaml → tracking
      const brandSlug = utmCampaign.split('_w')[0];
      return brandSlug ? `brand_ad:${brandSlug}` : source;
    }
    return source;
  }
  return classifyReferrer(referrer);
};

/**
 * Reads UTM params + referrer from the current page and persists the normalized
 * entry_source to sessionStorage, but only if it hasn't already been set this session.
 */
export const captureEntrySource = () => {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(ENTRY_SOURCE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const entrySource = normalizeEntrySource({
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      referrer: document.referrer,
    });

    window.sessionStorage.setItem(ENTRY_SOURCE_KEY, entrySource);
  } catch {
    // sessionStorage unavailable (e.g. private mode with storage blocked) — ignore
  }
};

/** Returns the persisted entry_source for this session, or 'direct' if unavailable. */
export const getEntrySource = () => {
  if (typeof window === 'undefined') return 'direct';
  try {
    return window.sessionStorage.getItem(ENTRY_SOURCE_KEY) || 'direct';
  } catch {
    return 'direct';
  }
};
