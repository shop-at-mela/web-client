import { createIntl } from 'react-intl';
import enMessages from '../translations/en.json';
import {
  getBrandUsShipping,
  getDutiesType,
  getDutiesTypeForAnalytics,
  getShippingTerms,
  isShippingStale,
  shipsToUs,
  SHIPPING_LINE_MAX_CHARS,
} from './brandShipping';
import { BRANDS } from './brandShipping.fixtures';

describe('getBrandUsShipping', () => {
  it('reads brandUsShipping from the author profile', () => {
    const author = { attributes: { profile: { publicData: { brandUsShipping: { duties: 'ddp' } } } } };
    expect(getBrandUsShipping(author)).toEqual({ duties: 'ddp' });
  });

  it.each([[undefined], [null], [{}], [{ attributes: { profile: {} } }], [{ attributes: { profile: { publicData: { brandUsShipping: null } } } }], [{ attributes: { profile: { publicData: { brandUsShipping: 'ddp' } } } }], [{ attributes: { profile: { publicData: { brandUsShipping: ['ddp'] } } } }]])(
    'returns null for missing or malformed data (%#)',
    author => {
      expect(getBrandUsShipping(author)).toBeNull();
    }
  );
});

describe('getDutiesType', () => {
  const now = new Date('2026-10-06T12:00:00Z');
  const fresh = { checkedAt: '2026-10-04' };

  it('maps the duty states for fresh data', () => {
    expect(getDutiesType({ ...fresh, duties: 'ddp', method: 'flat_rate' }, now)).toBe('ddp');
    expect(getDutiesType({ ...fresh, duties: 'ddu', method: 'flat_rate' }, now)).toBe('ddu');
  });

  it('treats a missing or unrecognized duties value as unknown', () => {
    expect(getDutiesType({ ...fresh, method: 'flat_rate' }, now)).toBe('unknown');
    expect(getDutiesType({ ...fresh, duties: 'maybe' }, now)).toBe('unknown');
    expect(getDutiesType(null, now)).toBe('unknown');
    expect(getDutiesType(undefined, now)).toBe('unknown');
  });

  it('method none wins over duties', () => {
    expect(getDutiesType({ ...fresh, duties: 'ddu', method: 'none' }, now)).toBe('none');
  });

  it('fails closed to unknown when checkedAt is missing or older than 180 days', () => {
    expect(getDutiesType({ duties: 'ddp', method: 'flat_rate' }, now)).toBe('unknown');
    expect(getDutiesType({ duties: 'ddu', method: 'none', checkedAt: '2026-01-01' }, now)).toBe('unknown');
    expect(getDutiesType({ duties: 'ddp', checkedAt: '2026-01-01' }, now)).toBe('unknown');
  });
});

describe('isShippingStale', () => {
  const now = new Date('2026-10-06T12:00:00Z');

  it('is fresh up to and including 180 days', () => {
    expect(isShippingStale('2026-10-06', now)).toBe(false);
    expect(isShippingStale('2026-04-09', now)).toBe(false); // exactly 180 days
  });

  it('is stale beyond 180 days', () => {
    expect(isShippingStale('2026-04-08', now)).toBe(true);
    expect(isShippingStale('2025-10-04', now)).toBe(true);
  });

  it('fails closed on missing, malformed or impossible dates', () => {
    [undefined, null, '', 'yesterday', '2026-13-45', '10/04/2026', 20261004, {}].forEach(value =>
      expect(isShippingStale(value, now)).toBe(true)
    );
  });

  it('fails closed on a date in the future beyond clock skew', () => {
    expect(isShippingStale('2026-10-20', now)).toBe(true);
    expect(isShippingStale('2026-10-07', now)).toBe(false);
  });

  it('accepts a timestamp for now', () => {
    expect(isShippingStale('2026-10-04', now.getTime())).toBe(false);
  });
});

describe('shipsToUs', () => {
  it('is true for every known method except none', () => {
    ['free', 'flat_rate', 'flat_rate_free_over_threshold', 'calculated_at_checkout', 'calculated_free_over_threshold'].forEach(
      method => expect(shipsToUs({ method })).toBe(true)
    );
  });

  it('is false for none, unknown methods and no data', () => {
    expect(shipsToUs({ method: 'none' })).toBe(false);
    expect(shipsToUs({ method: 'carrier_pigeon' })).toBe(false);
    expect(shipsToUs({ duties: 'ddp' })).toBe(false);
    expect(shipsToUs(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getShippingTerms: exact strings for every method x duties combination
// ---------------------------------------------------------------------------

const intl = createIntl({ locale: 'en', messages: enMessages });
const NOW = new Date('2026-10-06T12:00:00Z');
const FRESH = '2026-10-04';

const terms = (usShipping, brand = 'Nicobar') => getShippingTerms(usShipping, brand, intl, NOW);
const textOf = (data, brand) => terms({ checkedAt: FRESH, ...data }, brand).text;

describe('getShippingTerms: shipping sentence per method', () => {
  it('free', () => {
    expect(textOf({ method: 'free', duties: 'ddp' })).toBe('Nicobar ships free to the US.');
  });

  it('flat_rate with a USD fee', () => {
    expect(textOf({ method: 'flat_rate', feeUsd: 30, duties: 'ddp' })).toBe(
      'Nicobar ships to the US for $30.'
    );
  });

  it('flat_rate with cents', () => {
    expect(textOf({ method: 'flat_rate', feeUsd: 7.99, duties: 'ddp' })).toBe(
      'Nicobar ships to the US for $7.99.'
    );
  });

  it('flat_rate with an INR sourced fee says "about" and rounds to whole dollars', () => {
    expect(
      textOf({ method: 'flat_rate', feeUsd: 33.6, feeApprox: true, duties: 'ddp' }, 'House of Chikankari')
    ).toBe('House of Chikankari ships to the US for about $34.');
  });

  it('flat_rate_free_over_threshold with fee and threshold', () => {
    expect(
      textOf({ method: 'flat_rate_free_over_threshold', feeUsd: 30, freeOverUsd: 150, duties: 'ddp' })
    ).toBe('Nicobar ships to the US for $30, free on orders over $150.');
  });

  it('flat_rate_free_over_threshold with an INR sourced threshold prefixes "about"', () => {
    expect(
      textOf({
        method: 'flat_rate_free_over_threshold',
        feeUsd: 51,
        feeApprox: true,
        freeOverUsd: 375,
        freeOverApprox: true,
        duties: 'ddp',
      })
    ).toBe('Nicobar ships to the US for about $51, free on orders over about $375.');
  });

  it('flat_rate_free_over_threshold with an unknown threshold (Kaunteya)', () => {
    expect(
      textOf({ method: 'flat_rate_free_over_threshold', feeUsd: 51, feeApprox: true, duties: 'ddp' }, 'Kaunteya')
    ).toBe('Kaunteya ships to the US for about $51. Larger orders may ship free.');
  });

  it('flat_rate_free_over_threshold with an unknown fee (Vilvah)', () => {
    expect(
      textOf({ method: 'flat_rate_free_over_threshold', freeOverUsd: 69, duties: 'ddp' }, 'Vilvah Store')
    ).toBe('Vilvah Store ships free to the US on orders over $69.');
  });

  it('flat_rate_free_over_threshold with fee and threshold both unknown', () => {
    expect(textOf({ method: 'flat_rate_free_over_threshold', duties: 'ddp' })).toBe(
      'Nicobar ships to the US.'
    );
  });

  it('calculated_at_checkout', () => {
    expect(textOf({ method: 'calculated_at_checkout', duties: 'ddp' })).toBe(
      'Nicobar ships to the US. Its checkout shows the shipping cost.'
    );
  });

  it('calculated_free_over_threshold', () => {
    expect(textOf({ method: 'calculated_free_over_threshold', freeOverUsd: 150, duties: 'ddp' })).toBe(
      'Nicobar ships free to the US on orders over $150. Below that, its checkout shows the cost.'
    );
  });

  it('calculated_free_over_threshold with an unknown threshold falls back to calculated', () => {
    expect(textOf({ method: 'calculated_free_over_threshold', duties: 'ddp' })).toBe(
      'Nicobar ships to the US. Its checkout shows the shipping cost.'
    );
  });

  it('none', () => {
    expect(terms({ checkedAt: FRESH, method: 'none', duties: 'ddu' }, 'Pluchi')).toMatchObject({
      state: 'none',
      text: "Pluchi doesn't ship to the US yet.",
      duties: null,
      dutiesChip: false,
    });
  });
});

describe('getShippingTerms: duty sentence per state (shipping cost known)', () => {
  const flat = { method: 'flat_rate', feeUsd: 30 };

  it('DDP in price: no sentence, chip instead', () => {
    const result = terms({ checkedAt: FRESH, ...flat, duties: 'ddp' });
    expect(result.text).toBe('Nicobar ships to the US for $30.');
    expect(result.duties).toBeNull();
    expect(result.dutiesChip).toBe(true);
    expect(result.dutiesState).toBe('ddp_in_price');
  });

  it('DDP in price is the default when dutiesCollected is missing or in_price', () => {
    expect(terms({ checkedAt: FRESH, ...flat, duties: 'ddp', dutiesCollected: 'in_price' }).dutiesChip).toBe(true);
  });

  it('DDP added at checkout (Vilvah): sentence, no chip', () => {
    const result = terms({ checkedAt: FRESH, ...flat, duties: 'ddp', dutiesCollected: 'at_checkout' });
    expect(result.text).toBe(
      'Nicobar ships to the US for $30. It adds US duties at checkout, so nothing is due on delivery.'
    );
    expect(result.dutiesChip).toBe(false);
  });

  it('DDU: duties are extra, paid on delivery', () => {
    const result = terms({ checkedAt: FRESH, ...flat, duties: 'ddu' });
    expect(result.text).toBe('Nicobar ships to the US for $30. Import duties are extra, paid on delivery');
    expect(result.dutiesChip).toBe(false);
  });

  it('unknown duties with a known cost: states the gap', () => {
    expect(terms({ checkedAt: FRESH, ...flat }).text).toBe(
      "Nicobar ships to the US for $30. It doesn't say if US duties are included."
    );
  });

  it('free shipping counts as a known cost for the unknown duty sentence', () => {
    expect(terms({ checkedAt: FRESH, method: 'free' }).text).toBe(
      "Nicobar ships free to the US. It doesn't say if US duties are included."
    );
  });
});

describe('getShippingTerms: method x duties matrix', () => {
  const ddpSentence = 'Nicobar ships to the US. Its checkout shows the shipping cost.';
  const cases = [
    // [method, extra fields, duties, expected text]
    ['calculated_at_checkout', {}, 'ddp', ddpSentence],
    [
      'calculated_at_checkout',
      {},
      'ddu',
      'Nicobar ships to the US. Its checkout shows the cost. Import duties are extra, paid on delivery',
    ],
    [
      'calculated_at_checkout',
      {},
      undefined,
      "Nicobar ships to the US. It doesn't list its shipping cost or say if duties are included.",
    ],
    [
      'calculated_free_over_threshold',
      { freeOverUsd: 150 },
      'ddu',
      // 109 characters with the threshold, 104 without it: the compact cost wording is used
      'Nicobar ships to the US. Its checkout shows the cost. Import duties are extra, paid on delivery',
    ],
    [
      'calculated_free_over_threshold',
      { freeOverUsd: 150 },
      undefined,
      "Nicobar ships to the US. It doesn't list its shipping cost or say if duties are included.",
    ],
    [
      'flat_rate',
      {},
      undefined,
      "Nicobar ships to the US. It doesn't list its shipping cost or say if duties are included.",
    ],
    [
      'flat_rate_free_over_threshold',
      { freeOverUsd: 69 },
      undefined,
      "Nicobar ships to the US. It doesn't list its shipping cost or say if duties are included.",
    ],
    [
      'flat_rate',
      {},
      'ddu',
      'Nicobar ships to the US. Import duties are extra, paid on delivery',
    ],
  ];

  it.each(cases)('%s %j with duties %s', (method, extra, duties, expected) => {
    expect(textOf({ method, ...extra, ...(duties ? { duties } : {}) })).toBe(expected);
  });

  it('merged unknown sentence (Masilo) is a single sentence pair with the brand named once', () => {
    const result = terms({ checkedAt: FRESH, method: 'calculated_at_checkout' }, 'Masilo');
    expect(result.text).toBe(
      "Masilo ships to the US. It doesn't list its shipping cost or say if duties are included."
    );
    expect(result.duties).toBeNull();
    expect(result.text.match(/Masilo/g)).toHaveLength(1);
  });
});

describe('getShippingTerms: no data, stale and malformed', () => {
  const neutral = 'Isharya sets shipping and duties at its checkout.';

  it.each([[undefined], [null], [{}], [{ checkedAt: FRESH }], [{ checkedAt: FRESH, method: 'carrier_pigeon' }]])(
    'shows the neutral fallback for %j',
    data => {
      const result = getShippingTerms(data, 'Isharya', intl, NOW);
      expect(result.state).toBe('noData');
      expect(result.text).toBe(neutral);
      expect(result.duties).toBeNull();
      expect(result.dutiesChip).toBe(false);
    }
  );

  it('fails closed to the neutral fallback with no checkedAt (Nicobar today)', () => {
    const result = getShippingTerms({ duties: 'ddp', method: 'flat_rate_free_over_threshold', feeUsd: 30, freeOverUsd: 150 }, 'Nicobar', intl, NOW);
    expect(result.text).toBe('Nicobar sets shipping and duties at its checkout.');
    expect(result.dutiesChip).toBe(false);
  });

  it('fails closed when checkedAt is older than 180 days', () => {
    const result = getShippingTerms(
      { duties: 'ddu', method: 'flat_rate', feeUsd: 30, checkedAt: '2026-04-01' },
      'Fizzy Goblet',
      intl,
      NOW
    );
    expect(result.text).toBe('Fizzy Goblet sets shipping and duties at its checkout.');
  });

  it('is still fresh at 180 days', () => {
    const result = getShippingTerms(
      { duties: 'ddu', method: 'flat_rate', feeUsd: 30, checkedAt: '2026-04-09' },
      'Fizzy Goblet',
      intl,
      NOW
    );
    expect(result.state).toBe('shipping');
  });

  it('never states the old blanket claims', () => {
    [undefined, {}, { method: 'flat_rate' }].forEach(data => {
      expect(getShippingTerms(data, 'Isharya', intl, NOW).text).not.toMatch(/50 states|ships to the US/i);
    });
  });
});

describe('getShippingTerms: line budget', () => {
  it('Fizzy Goblet full sentence is over budget, so the threshold clause is dropped', () => {
    const data = { checkedAt: FRESH, duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 15, freeOverUsd: 100 };
    const result = terms(data, 'Fizzy Goblet');
    expect(result.text).toBe('Fizzy Goblet ships to the US for $15. Import duties are extra, paid on delivery');
    expect(result.thresholdDropped).toBe(true);
  });

  it('keeps the threshold when the line fits', () => {
    const result = terms({
      checkedAt: FRESH,
      duties: 'ddp',
      method: 'flat_rate_free_over_threshold',
      feeUsd: 30,
      freeOverUsd: 150,
    });
    expect(result.thresholdDropped).toBe(false);
    expect(result.text).toContain('free on orders over $150');
  });

  it.each(BRANDS)('%s: shipping line is at most the budget', (brand, data) => {
    const result = terms({ checkedAt: FRESH, ...data }, brand);
    expect(result.text.length).toBeLessThanOrEqual(SHIPPING_LINE_MAX_CHARS);
    expect(result.text).toContain(brand);
  });

  it('SuperBottoms (calculated shipping, duties extra) fits only with the compact wording', () => {
    expect(terms({ checkedAt: FRESH, duties: 'ddu', method: 'calculated_at_checkout' }, 'SuperBottoms').text).toBe(
      'SuperBottoms ships to the US. Its checkout shows the cost. Import duties are extra, paid on delivery'
    );
  });
});

describe('copy rules for every template', () => {
  const allKeys = Object.keys(enMessages).filter(key => key.startsWith('BrandShipping.'));

  it.each(allKeys)('%s has no dash characters, no DDP or DDU terms and no threshold math', key => {
    const value = enMessages[key];
    expect(value).not.toMatch(/[-–—]/);
    expect(value).not.toMatch(/\bDD[PU]\b/);
    expect(value).not.toMatch(/\bIndian\b/);
    expect(value).not.toMatch(/this item|your cart|you.re \$/i);
  });

  it('never reads free text notes', () => {
    // The util must only read structured keys (PRD P1-4).
    const source = require('fs').readFileSync(require('path').join(__dirname, 'brandShipping.js'), 'utf8');
    expect(source).not.toMatch(/us_shipping_note|brand_content|usShippingNote/);
  });
});

describe('getDutiesTypeForAnalytics', () => {
  const now = new Date('2026-10-06T12:00:00Z');
  const author = publicData => ({ attributes: { profile: { publicData } } });

  it('is null when no brand profile is available (missing author, or no publicData)', () => {
    expect(getDutiesTypeForAnalytics(undefined, now)).toBeNull();
    expect(getDutiesTypeForAnalytics(null, now)).toBeNull();
    expect(getDutiesTypeForAnalytics({}, now)).toBeNull();
    expect(getDutiesTypeForAnalytics({ attributes: { profile: {} } }, now)).toBeNull();
  });

  it('is unknown when the profile loaded but has no brandUsShipping', () => {
    expect(getDutiesTypeForAnalytics(author({}), now)).toBe('unknown');
    expect(getDutiesTypeForAnalytics(author({ brand: 'Ankid' }), now)).toBe('unknown');
  });

  it('maps ddp, ddu and none for fresh data', () => {
    const fresh = { checkedAt: '2026-10-04' };
    expect(getDutiesTypeForAnalytics(author({ brandUsShipping: { ...fresh, duties: 'ddp' } }), now)).toBe('ddp');
    expect(getDutiesTypeForAnalytics(author({ brandUsShipping: { ...fresh, duties: 'ddu' } }), now)).toBe('ddu');
    expect(getDutiesTypeForAnalytics(author({ brandUsShipping: { ...fresh, method: 'none' } }), now)).toBe('none');
  });

  it('is unknown for stale data', () => {
    expect(
      getDutiesTypeForAnalytics(author({ brandUsShipping: { duties: 'ddp', checkedAt: '2025-01-01' } }), now)
    ).toBe('unknown');
  });
});
