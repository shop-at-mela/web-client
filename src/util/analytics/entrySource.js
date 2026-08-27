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

const SEARCH_ENGINE_HOSTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'brave.', 'ecosia.'];
const SOCIAL_HOSTS = {
  'pinterest.': 'pinterest',
  'instagram.': 'instagram',
  'reddit.': 'reddit',
  'facebook.': 'facebook',
  'tiktok.': 'tiktok',
};

/**
 * Known Google product/tool subdomains that are NOT search results pages, checked before
 * the SEARCH_ENGINE_HOSTS match below. Without this, host.includes('google.') would also
 * match these (e.g. 'tagassistant.google.com'.includes('google.') is true), misattributing
 * our own GTM Preview/debugging traffic — and anyone else's Google-account activity — as
 * organic search (found via real testing traffic, see crossshop-tracking-prd.md §13).
 *
 * Deliberately NOT switched to anchored matching (e.g. host.endsWith('.google.com')) or to
 * an exact-hostname allowlist for search engines generally: real Yahoo search referrers
 * commonly come from the subdomain `search.yahoo.com` (not bare `yahoo.com`), and Facebook's
 * outbound-link redirector commonly uses `l.facebook.com`/`lm.facebook.com` — an anchored or
 * exact-match approach would silently stop recognizing those. This exclusion list targets
 * only the concretely-observed Google false positive without that tradeoff.
 */
const GOOGLE_NON_SEARCH_SUBDOMAINS = [
  'tagassistant.google.com',
  'accounts.google.com',
  'myaccount.google.com',
  'mail.google.com',
  'docs.google.com',
  'drive.google.com',
  'analytics.google.com',
  'tagmanager.google.com',
  'support.google.com',
  'policies.google.com',
  'marketingplatform.google.com',
];

/**
 * AI answer engines — kept as a distinct entry_source from 'seo', per
 * mela-docs/product/prds/seo-aeo-category-brand-pages-prd.md, which tracks AEO (Answer
 * Engine Optimization) as a separate signal from traditional SEO with its own metrics.
 * Folding these into 'seo' would make it impossible to ever measure whether the AEO
 * investment (structured data, FAQ blocks, entity schema) is working.
 *
 * `bing.com` is deliberately NOT included here even though ChatGPT's browsing/citation tool
 * can route through Bing search results — the referrer hostname is identical to a real human
 * Bing search in that case, so it can't be safely distinguished and bucketing it as
 * 'ai_search' would misclassify genuine Bing search traffic instead.
 */
const AI_SEARCH_HOSTS = ['perplexity.ai', 'bard.google.com', 'gemini.google.com', 'chatgpt.com', 'chat.openai.com'];

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

  if (AI_SEARCH_HOSTS.some(needle => host.includes(needle))) return 'ai_search';

  if (GOOGLE_NON_SEARCH_SUBDOMAINS.includes(host)) {
    // Known Google product/tool, not a search results page — fall through to the raw-host
    // passthrough below rather than misattributing as 'seo'.
    return host;
  }

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
 * @returns {string} normalized entry_source, e.g. "pinterest", "seo", "ai_search", "brand_ad:superbottoms", "direct"
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

/**
 * Removes utm_* params from the visible URL via history.replaceState, without a navigation
 * or reload. Call only after captureEntrySource() has already read them. Leaves any
 * non-utm query params and the hash untouched, and no-ops if there is nothing to strip
 * (avoids pushing a redundant history entry state).
 */
export const stripUtmParams = () => {
  if (typeof window === 'undefined') return;
  try {
    const { pathname, search, hash } = window.location;
    const params = new URLSearchParams(search);
    const utmKeys = [...params.keys()].filter(key => key.startsWith('utm_'));
    if (utmKeys.length === 0) return;

    utmKeys.forEach(key => params.delete(key));
    const newSearch = params.toString();
    const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ''}${hash}`;
    window.history.replaceState(window.history.state, '', newUrl);
  } catch {
    // history API unavailable — ignore
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
