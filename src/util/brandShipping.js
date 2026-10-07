/**
 * Helpers for a brand's own US shipping and duty terms, read from the brand profile's
 * `publicData.brandUsShipping` (see mela-docs/product/prds/international-shipping-transparency-prd.md).
 *
 * Contract (every key optional, unknown stays unknown):
 *   duties: 'ddp' | 'ddu'
 *   dutiesCollected: 'in_price' | 'at_checkout'
 *   method: 'free' | 'flat_rate' | 'flat_rate_free_over_threshold' |
 *           'calculated_at_checkout' | 'calculated_free_over_threshold' | 'none'
 *   feeUsd, feeApprox, freeOverUsd, freeOverApprox (amounts are already USD, never converted here)
 *   shipsFrom: 'india' | 'us_warehouse' | 'mixed'
 *   checkedAt: 'YYYY-MM-DD'
 *
 * Every string a shopper sees is built from this structured data through en.json keys.
 * Free text such as a brand note is never parsed.
 */

const METHODS = [
  'free',
  'flat_rate',
  'flat_rate_free_over_threshold',
  'calculated_at_checkout',
  'calculated_free_over_threshold',
  'none',
];

/**
 * Read `brandUsShipping` from a brand (author) user entity.
 * Returns null when the profile is missing or the field is absent or malformed.
 *
 * @param {Object?} author Sharetribe user entity (listing.author)
 * @returns {Object|null}
 */
export const getBrandUsShipping = author => {
  const value = author?.attributes?.profile?.publicData?.brandUsShipping;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
};

/**
 * Days after which a brand's shipping facts are treated as unknown (PRD P1.10).
 */
export const SHIPPING_STALE_AFTER_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fail closed: shipping facts are stale when `checkedAt` is missing, not a valid
 * 'YYYY-MM-DD' date, in the future (beyond one day of clock skew), or older than 180 days.
 * Every surface falls back to the neutral "no data" copy for stale data.
 *
 * @param {string?} checkedAt ISO date 'YYYY-MM-DD'
 * @param {Date|number} now injected so callers and tests are deterministic
 * @returns {boolean}
 */
export const isShippingStale = (checkedAt, now = new Date()) => {
  if (typeof checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) return true;
  const checkedMs = Date.parse(`${checkedAt}T00:00:00Z`);
  if (Number.isNaN(checkedMs)) return true;
  const ageMs = new Date(now).getTime() - checkedMs;
  if (Number.isNaN(ageMs) || ageMs < -DAY_MS) return true;
  // Whole calendar days, so a date exactly 180 days old is still fresh all day.
  return Math.floor(ageMs / DAY_MS) > SHIPPING_STALE_AFTER_DAYS;
};

/**
 * Duty state of a brand: 'ddp' (duties included or added at checkout), 'ddu' (paid on
 * delivery), 'none' (the brand does not ship to the US) or 'unknown'.
 * Missing, malformed or stale data is 'unknown'. Callers with no brand profile at all send
 * null to analytics instead of calling this.
 *
 * @param {Object?} usShipping brandUsShipping value
 * @param {Date|number} now injected for the staleness check
 * @returns {'ddp'|'ddu'|'none'|'unknown'}
 */
export const getDutiesType = (usShipping, now = new Date()) => {
  if (!usShipping || isShippingStale(usShipping.checkedAt, now)) return 'unknown';
  if (usShipping.method === 'none') return 'none';
  if (usShipping.duties === 'ddp' || usShipping.duties === 'ddu') return usShipping.duties;
  return 'unknown';
};

/**
 * `duties_type` value for analytics events.
 * null when no brand profile is available at all (for example a heart icon on a grid card
 * whose author entity carries no publicData), so missing data is not counted as unknown
 * duties. 'unknown' means the profile loaded and duties are not stated, or the data is stale.
 *
 * @param {Object?} author brand (author) user entity
 * @param {Date|number} now injected for the staleness check
 * @returns {'ddp'|'ddu'|'none'|'unknown'|null}
 */
export const getDutiesTypeForAnalytics = (author, now = new Date()) => {
  const publicData = author?.attributes?.profile?.publicData;
  if (!publicData || typeof publicData !== 'object') return null;
  return getDutiesType(getBrandUsShipping(author), now);
};

const hasKnownMethod = usShipping => !!usShipping && METHODS.includes(usShipping.method);

/**
 * The two shipping and duty lines of the pre-redirect trust sheet.
 * Brand is the subject wherever the brand is the one acting; the sheet heading already
 * names the brand for the rest.
 *
 * @param {Object?} usShipping brandUsShipping value
 * @param {string} brand brand display name
 * @param {Object} intl react-intl instance
 * @returns {{shipping: string, duties: string|null}} duties is null when the brand does not ship to the US
 */
export const getTrustSheetShippingLines = (usShipping, brand, intl) => {
  const t = (key, values) => intl.formatMessage({ id: `RedirectTrustSheet.${key}` }, values);

  if (!hasKnownMethod(usShipping)) {
    return {
      shipping: t('trustShippingUnknown', { brand }),
      duties: t('trustDutiesUnknown', { brand }),
    };
  }

  if (usShipping.method === 'none') {
    return { shipping: t('trustShippingNone', { brand }), duties: null };
  }

  const shipping = t('trustShippingShips', { brand });
  if (usShipping.duties === 'ddu') {
    return { shipping, duties: t('trustDutiesDdu') };
  }
  if (usShipping.duties === 'ddp') {
    const key =
      usShipping.dutiesCollected === 'at_checkout' ? 'trustDutiesDdpAtCheckout' : 'trustDutiesDdp';
    return { shipping, duties: t(key, { brand }) };
  }
  return { shipping, duties: t('trustDutiesUnknown', { brand }) };
};

/**
 * Short hero fact for a brand page: shown only when the brand's shipping method is known
 * and is not 'none'.
 *
 * @param {Object?} usShipping brandUsShipping value
 * @returns {boolean}
 */
export const shipsToUs = usShipping => hasKnownMethod(usShipping) && usShipping.method !== 'none';

// ---------------------------------------------------------------------------
// Product page shipping line (PRD P1.2)
// ---------------------------------------------------------------------------

/**
 * Character budget for the shipping line (shipping sentence plus duty sentence) at 375px.
 * A line over budget drops its free shipping threshold clause.
 */
export const SHIPPING_LINE_MAX_CHARS = 100;

const isAmount = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * Format an amount that is already in USD. Never converts currency. Approximate amounts are
 * rounded to whole dollars and prefixed with "about".
 */
export const formatUsdAmount = (intl, amount, approx) => {
  const format = (value, digits) =>
    intl.formatNumber(value, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  if (approx) {
    return intl.formatMessage(
      { id: 'BrandShipping.approxAmount' },
      { amount: format(Math.round(amount), 0) }
    );
  }
  return format(amount, Number.isInteger(amount) ? 0 : 2);
};

/**
 * Whether the brand's US shipping cost is a known number or free. False for calculated
 * methods and for flat rates with no recorded fee.
 */
const isShippingCostKnown = usShipping => {
  switch (usShipping.method) {
    case 'free':
      return true;
    case 'flat_rate':
    case 'flat_rate_free_over_threshold':
      return isAmount(usShipping.feeUsd);
    default:
      return false;
  }
};

/**
 * Duty state used by the product page: 'ddp_in_price', 'ddp_at_checkout', 'ddu' or 'unknown'.
 */
const getDutiesState = usShipping => {
  if (usShipping.duties === 'ddu') return 'ddu';
  if (usShipping.duties === 'ddp') {
    return usShipping.dutiesCollected === 'at_checkout' ? 'ddp_at_checkout' : 'ddp_in_price';
  }
  return 'unknown';
};

/**
 * The shipping sentence of a brand with usable data. The brand is named here once; the
 * second sentence of a template uses "Its".
 *
 * @param {Object} usShipping a fresh brandUsShipping with a known method other than 'none'
 * @param {string} brand
 * @param {Object} intl
 * @param {boolean} includeThreshold false drops every free shipping threshold clause
 * @param {boolean} compact true uses the shortest wording for the calculated cost sentence
 */
const getShippingSentence = (usShipping, brand, intl, includeThreshold, compact) => {
  const t = (key, values) => intl.formatMessage({ id: `BrandShipping.${key}` }, values);
  const hasFee = isAmount(usShipping.feeUsd);
  const hasThreshold = isAmount(usShipping.freeOverUsd);
  const fee = hasFee ? formatUsdAmount(intl, usShipping.feeUsd, usShipping.feeApprox) : null;
  const threshold = hasThreshold
    ? formatUsdAmount(intl, usShipping.freeOverUsd, usShipping.freeOverApprox)
    : null;

  switch (usShipping.method) {
    case 'free':
      return t('shipsFree', { brand });
    case 'flat_rate':
      return hasFee ? t('flatRate', { brand, fee }) : t('shipsPlain', { brand });
    case 'flat_rate_free_over_threshold':
      if (hasFee && hasThreshold && includeThreshold) {
        return t('flatRateFreeOver', { brand, fee, threshold });
      }
      if (hasFee && !hasThreshold && includeThreshold) {
        return t('flatRateThresholdUnknown', { brand, fee });
      }
      if (hasFee) return t('flatRate', { brand, fee });
      if (hasThreshold && includeThreshold) return t('feeUnknownFreeOver', { brand, threshold });
      return t('shipsPlain', { brand });
    case 'calculated_free_over_threshold':
      if (hasThreshold && includeThreshold) return t('calculatedFreeOver', { brand, threshold });
      return t(compact ? 'calculatedCompact' : 'calculated', { brand });
    case 'calculated_at_checkout':
    default:
      return t(compact ? 'calculatedCompact' : 'calculated', { brand });
  }
};

const composeTerms = (usShipping, brand, intl, includeThreshold, compact = false) => {
  const t = (key, values) => intl.formatMessage({ id: `BrandShipping.${key}` }, values);
  const dutiesState = getDutiesState(usShipping);

  // Unknown duties and an unknown shipping cost read as one merged sentence (two separate
  // sentences took four visual lines at 375px).
  if (dutiesState === 'unknown' && !isShippingCostKnown(usShipping)) {
    return {
      shipping: t('unknownMerged', { brand }),
      duties: null,
      dutiesState,
      dutiesChip: false,
    };
  }

  const shipping = getShippingSentence(usShipping, brand, intl, includeThreshold, compact);
  switch (dutiesState) {
    case 'ddp_in_price':
      return { shipping, duties: null, dutiesState, dutiesChip: true };
    case 'ddp_at_checkout':
      return { shipping, duties: t('dutiesAtCheckout'), dutiesState, dutiesChip: false };
    case 'ddu':
      return { shipping, duties: t('dutiesExtra'), dutiesState, dutiesChip: false };
    default:
      return { shipping, duties: t('dutiesUnknown'), dutiesState, dutiesChip: false };
  }
};

/**
 * All copy for the product page shipping line, built from structured data only.
 *
 * `text` is the logical shipping line: the shipping sentence followed by the duty sentence
 * (none for a DDP brand whose duties are in its prices; that shows as a chip). It aims for at
 * most SHIPPING_LINE_MAX_CHARS characters: over budget, the free shipping threshold clause is
 * dropped (it stays on the brand page and the trust sheet), then the calculated cost sentence
 * is shortened. A very long brand name can still exceed the budget.
 *
 * Missing, stale or unrecognized data returns the neutral "sets shipping and duties at its
 * checkout" sentence, never a blanket claim.
 *
 * @param {Object?} usShipping brandUsShipping value
 * @param {string} brand brand display name
 * @param {Object} intl react-intl instance
 * @param {Date|number} now injected for the staleness check
 * @returns {{
 *   state: 'noData'|'none'|'shipping',
 *   text: string,
 *   shipping: string,
 *   duties: string|null,
 *   dutiesState: string|null,
 *   dutiesChip: boolean,
 *   thresholdDropped: boolean,
 * }}
 */
export const getShippingTerms = (usShipping, brand, intl, now = new Date()) => {
  const t = (key, values) => intl.formatMessage({ id: `BrandShipping.${key}` }, values);
  const neutral = (state, shipping) => ({
    state,
    text: shipping,
    shipping,
    duties: null,
    dutiesState: null,
    dutiesChip: false,
    thresholdDropped: false,
  });

  if (
    !usShipping ||
    !METHODS.includes(usShipping.method) ||
    isShippingStale(usShipping.checkedAt, now)
  ) {
    return neutral('noData', t('noData', { brand }));
  }
  if (usShipping.method === 'none') {
    return neutral('none', t('none', { brand }));
  }

  const join = parts => [parts.shipping, parts.duties].filter(Boolean).join(' ');
  const full = composeTerms(usShipping, brand, intl, true);
  const fullText = join(full);
  if (fullText.length <= SHIPPING_LINE_MAX_CHARS) {
    return { state: 'shipping', text: fullText, ...full, thresholdDropped: false };
  }

  // Over budget. First drop the free shipping threshold clause (it stays on the brand page
  // and the trust sheet), then shorten the calculated cost wording if still too long.
  const noThreshold = composeTerms(usShipping, brand, intl, false);
  const noThresholdText = join(noThreshold);
  const thresholdDropped = noThresholdText !== fullText;
  if (noThresholdText.length <= SHIPPING_LINE_MAX_CHARS) {
    return { state: 'shipping', text: noThresholdText, ...noThreshold, thresholdDropped };
  }
  const compact = composeTerms(usShipping, brand, intl, false, true);
  return { state: 'shipping', text: join(compact), ...compact, thresholdDropped };
};
