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
 * True when the brand has a recognized shipping method and fresh facts (PRD P1.10: stale or
 * missing `checkedAt` fails closed to the neutral copy on every surface).
 */
const hasUsableTerms = (usShipping, now) =>
  hasKnownMethod(usShipping) && !isShippingStale(usShipping.checkedAt, now);

/**
 * The shipping and duty items of the pre-redirect trust sheet (PRD P1.5). The sheet heading
 * already names the brand, so items drop the repeated name.
 *
 * @param {Object?} usShipping brandUsShipping value
 * @param {Object} intl react-intl instance
 * @param {Date|number} now injected for the staleness check
 * @returns {{shipping: string, duties: string|null}} duties is null when there is no usable
 *   data or the brand does not ship to the US
 */
export const getTrustSheetShippingLines = (usShipping, intl, now = new Date()) => {
  const t = key => intl.formatMessage({ id: `RedirectTrustSheet.${key}` });

  if (!hasUsableTerms(usShipping, now)) {
    return { shipping: t('shipping.noData'), duties: null };
  }
  if (usShipping.method === 'none') {
    return { shipping: t('shipping.none'), duties: null };
  }

  const shipping = getShippingSentence(
    usShipping,
    null,
    intl,
    true,
    false,
    'RedirectTrustSheet.shipping'
  );
  const dutiesKeyByState = {
    ddu: 'dutiesDdu',
    ddp_in_price: 'dutiesDdpInPrice',
    ddp_at_checkout: 'dutiesDdpAtCheckout',
    unknown: 'dutiesUnknown',
  };
  return { shipping, duties: t(dutiesKeyByState[getDutiesState(usShipping)]) };
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
 * @param {string} ns en.json key namespace holding the sentence templates (product page line,
 *   trust sheet items and brand page passage share the same structure)
 */
const getShippingSentence = (
  usShipping,
  brand,
  intl,
  includeThreshold,
  compact,
  ns = 'BrandShipping'
) => {
  const t = (key, values) => intl.formatMessage({ id: `${ns}.${key}` }, values);
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

// ---------------------------------------------------------------------------
// Tooltips (PRD P1.2, P1.4)
// ---------------------------------------------------------------------------

/**
 * Tooltip copy for the duty facts shown on the product page. `dutiesState` comes from
 * getShippingTerms(). Returns null when a state has no tooltip.
 *
 * @param {string?} dutiesState 'ddp_in_price' | 'ddp_at_checkout' | 'ddu' | 'unknown' | null
 * @param {string} brand
 * @param {Object} intl
 * @returns {string|null}
 */
export const getDutiesTooltip = (dutiesState, brand, intl) => {
  const idByState = {
    ddp_in_price: 'BrandShipping.tooltipDdpInPrice',
    ddu: 'BrandShipping.tooltipDdu',
  };
  const id = idByState[dutiesState];
  return id ? intl.formatMessage({ id }, { brand }) : null;
};

// ---------------------------------------------------------------------------
// Brand page hero line (PRD P1.6)
// ---------------------------------------------------------------------------

/**
 * Facts for the brand page hero meta line. Only fresh data counts: stale or missing data shows
 * neither "Ships to the US" nor "Duties included".
 *
 * @param {Object?} usShipping brandUsShipping value
 * @param {Date|number} now injected for the staleness check
 * @returns {{ships: boolean, doesNotShip: boolean, dutiesIncluded: boolean}}
 */
export const getBrandHeroShipping = (usShipping, now = new Date()) => {
  if (!hasUsableTerms(usShipping, now)) {
    return { ships: false, doesNotShip: false, dutiesIncluded: false };
  }
  if (usShipping.method === 'none') {
    return { ships: false, doesNotShip: true, dutiesIncluded: false };
  }
  return { ships: true, doesNotShip: false, dutiesIncluded: usShipping.duties === 'ddp' };
};

// ---------------------------------------------------------------------------
// Brand page "Shipping to the US" section and FAQPage JSON-LD (PRD P1.7, P1.8)
// ---------------------------------------------------------------------------

/**
 * Whether the brand's free shipping fact is known well enough to answer "free shipping?".
 */
const hasFreeShippingFact = usShipping =>
  usShipping.method === 'free' ||
  ((usShipping.method === 'flat_rate_free_over_threshold' ||
    usShipping.method === 'calculated_free_over_threshold') &&
    isAmount(usShipping.freeOverUsd));

const getFreeShippingAnswer = (usShipping, brand, intl) => {
  const t = (key, values) => intl.formatMessage({ id: `BrandShipping.${key}` }, values);
  if (usShipping.method === 'free') return t('faqFreeAlways', { brand });
  const threshold = formatUsdAmount(intl, usShipping.freeOverUsd, usShipping.freeOverApprox);
  if (isAmount(usShipping.feeUsd)) {
    const fee = formatUsdAmount(intl, usShipping.feeUsd, usShipping.feeApprox);
    return t('faqFreeOverWithFee', { brand, threshold, fee });
  }
  return t('faqFreeOver', { brand, threshold });
};

const getShipsFromSentence = (usShipping, intl) => {
  const idByOrigin = {
    india: 'BrandShipping.faqShipsFromIndia',
    us_warehouse: 'BrandShipping.faqShipsFromUs',
    mixed: 'BrandShipping.faqShipsFromMixed',
  };
  const id = idByOrigin[usShipping.shipsFrom];
  return id ? intl.formatMessage({ id }) : null;
};

const getDutiesAnswer = (usShipping, brand, intl) => {
  const idByState = {
    ddp_in_price: 'BrandShipping.faqDutiesDdpInPrice',
    ddp_at_checkout: 'BrandShipping.faqDutiesDdpAtCheckout',
    ddu: 'BrandShipping.faqDutiesDdu',
    unknown: 'BrandShipping.faqDutiesUnknown',
  };
  return intl.formatMessage({ id: idByState[getDutiesState(usShipping)] }, { brand });
};

const getPassageDuties = (usShipping, brand, intl) => {
  const idByState = {
    ddp_in_price: 'BrandPassage.dutiesDdpInPrice',
    ddp_at_checkout: 'BrandPassage.dutiesDdpAtCheckout',
    ddu: 'BrandPassage.dutiesDdu',
    unknown: 'BrandPassage.dutiesUnknown',
  };
  return intl.formatMessage({ id: idByState[getDutiesState(usShipping)] }, { brand });
};

/**
 * Format 'YYYY-MM-DD' as "October 7, 2026". Always UTC so the server and the browser agree.
 */
const formatCheckedDate = (intl, checkedAt) =>
  intl.formatDate(new Date(`${checkedAt}T00:00:00Z`), {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** The brand page passage is meant to be quotable on its own: 40 to 60 words (PRD P1.7). */
export const PASSAGE_MIN_WORDS = 40;
export const PASSAGE_MAX_WORDS = 60;
// Below this the short Mela role sentence is not enough to reach the minimum.
const PASSAGE_THIN_WORDS = 27;

const countWords = text => text.trim().split(/\s+/).length;

/**
 * Everything the brand page "Shipping to the US" section shows, and the FAQPage JSON-LD
 * built from it. The visible section and the structured data both call this one function, so
 * their question and answer text cannot drift apart (PRD P1.8).
 *
 * With fresh data the section has a passage, up to three FAQ items and a dated byline. With no
 * data, stale data or an unrecognized method it has a neutral passage and the first FAQ item
 * only, and no date (fail closed, PRD P1.10).
 *
 * @param {Object?} usShipping brandUsShipping value
 * @param {string} brand brand display name
 * @param {Object} intl react-intl instance
 * @param {Date|number} now injected for the staleness check
 * @returns {{
 *   state: 'noData'|'none'|'shipping',
 *   passage: string,
 *   faq: Array<{id: string, question: string, answer: string}>,
 *   byline: string|null,
 * }}
 */
export const getBrandShippingSection = (usShipping, brand, intl, now = new Date()) => {
  const t = (key, values) => intl.formatMessage({ id: `BrandShipping.${key}` }, values);
  const p = (key, values) => intl.formatMessage({ id: `BrandPassage.${key}` }, values);
  const shipsQuestion = {
    id: 'ships',
    question: t('faqShipsQuestion', { brand }),
  };

  if (!hasUsableTerms(usShipping, now)) {
    return {
      state: 'noData',
      passage: p('noData', { brand }),
      faq: [{ ...shipsQuestion, answer: t('noData', { brand }) }],
      byline: null,
    };
  }

  const byline = t('byline', { date: formatCheckedDate(intl, usShipping.checkedAt) });

  if (usShipping.method === 'none') {
    return {
      state: 'none',
      passage: p('none', { brand }),
      faq: [{ ...shipsQuestion, answer: t('none', { brand }) }],
      byline,
    };
  }

  const passageSentences = [
    getShippingSentence(usShipping, brand, intl, true, false, 'BrandPassage'),
    getPassageDuties(usShipping, brand, intl),
    p('closing', { brand }),
  ];
  // Short states (for example free shipping with duties in the prices) read thin as a quotable
  // passage. A fixed sentence about Mela's role brings them up to the minimum length, and it
  // states what Mela does not do, so it never implies Mela ships or collects duties.
  const baseWords = countWords(passageSentences.join(' '));
  if (baseWords < PASSAGE_THIN_WORDS) {
    passageSentences.push(p('roleLong', { brand }));
  } else if (baseWords < PASSAGE_MIN_WORDS) {
    passageSentences.push(p('role', { brand }));
  }
  const passage = passageSentences.join(' ');

  const shipsFrom = getShipsFromSentence(usShipping, intl);
  const shipsAnswer = [
    getShippingSentence(usShipping, brand, intl, true, false, 'BrandShipping'),
    shipsFrom,
  ]
    .filter(Boolean)
    .join(' ');

  const faq = [
    { ...shipsQuestion, answer: shipsAnswer },
    {
      id: 'duties',
      question: t('faqDutiesQuestion', { brand }),
      answer: getDutiesAnswer(usShipping, brand, intl),
    },
  ];
  if (hasFreeShippingFact(usShipping)) {
    faq.push({
      id: 'free',
      question: t('faqFreeQuestion', { brand }),
      answer: getFreeShippingAnswer(usShipping, brand, intl),
    });
  }

  return { state: 'shipping', passage, faq, byline };
};

/**
 * FAQPage structured data for a brand page, from the same items as the visible FAQ.
 *
 * @param {Array<{question: string, answer: string}>} faq items from getBrandShippingSection()
 * @param {{'@id': string}} organizationRef reference to the marketplace Organization node
 * @returns {Object} schema.org FAQPage node
 */
export const buildBrandFaqSchema = (faq, organizationRef) => ({
  '@type': 'FAQPage',
  author: organizationRef,
  publisher: organizationRef,
  mainEntity: faq.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
});
