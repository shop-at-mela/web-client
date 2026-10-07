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
 * Duty state of a brand: 'ddp' (duties included or added at checkout), 'ddu' (paid on
 * delivery), 'none' (the brand does not ship to the US) or 'unknown'.
 * Missing data is 'unknown'. Callers with no brand profile at all send null to analytics
 * instead of calling this.
 *
 * @param {Object?} usShipping brandUsShipping value
 * @returns {'ddp'|'ddu'|'none'|'unknown'}
 */
export const getDutiesType = usShipping => {
  if (!usShipping) return 'unknown';
  if (usShipping.method === 'none') return 'none';
  if (usShipping.duties === 'ddp' || usShipping.duties === 'ddu') return usShipping.duties;
  return 'unknown';
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
