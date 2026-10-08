import { createIntl } from 'react-intl';
import enMessages from '../translations/en.json';
import {
  buildBrandFaqSchema,
  getBrandHeroShipping,
  getBrandShippingSection,
  getDutiesTooltip,
  getTrustSheetShippingLines,
} from './brandShipping';
import { BRANDS } from './brandShipping.fixtures';

const intl = createIntl({ locale: 'en', messages: enMessages });
const NOW = new Date('2026-10-07T12:00:00Z');
const FRESH = '2026-10-04';
const words = text => text.trim().split(/\s+/).length;
const section = (data, brand = 'Nicobar') =>
  getBrandShippingSection({ checkedAt: FRESH, ...data }, brand, intl, NOW);

// A brand name long enough to stress the 60 word cap, and the longest real names.
const LONGEST_NAMES = [
  'Hemant & Nandita',
  'House of Chikankari',
  'Daughters of India',
  'The Alternate India',
];
const SHORTEST_NAMES = ['Suta', 'Ankid', 'Saphed', 'Nicobar'];

describe('getBrandShippingSection: passage length (P1.7)', () => {
  it.each(BRANDS)('%s: passage is 40 to 60 words and names the brand', (brand, data) => {
    const { passage } = section(data, brand);
    expect(words(passage)).toBeGreaterThanOrEqual(40);
    expect(words(passage)).toBeLessThanOrEqual(60);
    expect(passage).toContain(brand);
  });

  const METHODS = [
    { method: 'free' },
    { method: 'flat_rate', feeUsd: 34, feeApprox: true },
    { method: 'flat_rate_free_over_threshold', feeUsd: 15, freeOverUsd: 100 },
    { method: 'flat_rate_free_over_threshold', feeUsd: 51, feeApprox: true },
    { method: 'flat_rate_free_over_threshold', freeOverUsd: 69 },
    { method: 'calculated_at_checkout' },
    { method: 'calculated_free_over_threshold', freeOverUsd: 199 },
    { method: 'calculated_free_over_threshold' },
    { method: 'flat_rate' },
  ];
  const DUTIES = [
    {},
    { duties: 'ddp' },
    { duties: 'ddp', dutiesCollected: 'at_checkout' },
    { duties: 'ddu' },
  ];

  it('stays 40 to 60 words for every method x duties combination with the longest and shortest names', () => {
    [...LONGEST_NAMES, ...SHORTEST_NAMES].forEach(brand => {
      METHODS.forEach(method => {
        DUTIES.forEach(duties => {
          const { passage } = section({ ...method, ...duties }, brand);
          const count = words(passage);
          expect([brand, method, duties, count, count >= 40 && count <= 60]).toEqual([
            brand,
            method,
            duties,
            count,
            true,
          ]);
        });
      });
    });
  });

  it.each([
    ['no data', null],
    ['stale data', { method: 'flat_rate', feeUsd: 30, checkedAt: '2025-01-01' }],
    ['missing checkedAt (Nicobar today)', { method: 'flat_rate', duties: 'ddp', feeUsd: 30 }],
    ['unrecognized method', { method: 'teleport', checkedAt: FRESH }],
    ['method none', { method: 'none', checkedAt: FRESH }],
  ])('%s: passage is 40 to 60 words for every long name', (name, data) => {
    [...LONGEST_NAMES, 'Nicobar', 'Ankid'].forEach(brand => {
      const { passage } = getBrandShippingSection(data, brand, intl, NOW);
      expect([brand, words(passage) >= 40 && words(passage) <= 60]).toEqual([brand, true]);
    });
  });
});

describe('getBrandShippingSection: exact passages', () => {
  it('Nicobar (DDP, fresh, threshold)', () => {
    expect(
      section({
        duties: 'ddp',
        method: 'flat_rate_free_over_threshold',
        feeUsd: 30,
        freeOverUsd: 150,
      }).passage
    ).toBe(
      "Nicobar ships to US addresses for $30 per order, free on orders over $150. Nicobar includes US import duties in its prices, so nothing is due when your order arrives. You pay on Nicobar's own store, which sets the final cost."
    );
  });

  it('House of Chikankari (DDU, INR fee)', () => {
    expect(
      section(
        { duties: 'ddu', method: 'flat_rate', feeUsd: 34, feeApprox: true },
        'House of Chikankari'
      ).passage
    ).toBe(
      "House of Chikankari ships to US addresses for about $34 per order. Its prices don't include US import duties: the courier collects them before delivery. You pay on House of Chikankari's own store, which sets the final cost. Mela links to House of Chikankari's store and does not sell, ship or collect duties."
    );
  });

  it('Ankid (unknown duties)', () => {
    expect(section({ method: 'flat_rate', feeUsd: 28, feeApprox: true }, 'Ankid').passage).toBe(
      "Ankid ships to US addresses for about $28 per order. Ankid hasn't confirmed whether its prices include US import duties. You pay on Ankid's own store, which sets the final cost. Mela links to Ankid's store and does not sell, ship or collect duties."
    );
  });

  it('Kaunteya (threshold missing)', () => {
    expect(
      section(
        { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 51, feeApprox: true },
        'Kaunteya'
      ).passage
    ).toMatch(
      /^Kaunteya ships to US addresses for about \$51 per order\. Larger orders may ship free\. Its prices/
    );
  });

  it('SuperBottoms (calculated)', () => {
    expect(
      section({ duties: 'ddu', method: 'calculated_at_checkout' }, 'SuperBottoms').passage
    ).toMatch(
      /^SuperBottoms ships to US addresses\. Its checkout shows the shipping cost\. Its prices/
    );
  });

  it('Vilvah style DDP at checkout never claims duties are in the price', () => {
    const { passage } = section(
      {
        duties: 'ddp',
        dutiesCollected: 'at_checkout',
        method: 'flat_rate_free_over_threshold',
        freeOverUsd: 69,
      },
      'Vilvah Store'
    );
    expect(passage).toContain('adds US import duties to its order total at checkout');
    expect(passage).not.toContain('in its prices');
  });

  it('Isharya (null) and Nicobar without checkedAt get the neutral passage', () => {
    const neutral = getBrandShippingSection(null, 'Isharya', intl, NOW);
    expect(neutral.state).toBe('noData');
    expect(neutral.passage).toBe(
      "Isharya sets its own US shipping costs and duty terms, shown at its checkout. Mela has no current shipping details to confirm for Isharya, so check the checkout for the shipping cost, whether import duties are included, and delivery times before you pay. You pay on Isharya's own store."
    );
    const nicobar = getBrandShippingSection(
      { duties: 'ddp', method: 'flat_rate', feeUsd: 30 },
      'Nicobar',
      intl,
      NOW
    );
    expect(nicobar.state).toBe('noData');
    expect(nicobar.byline).toBeNull();
  });
});

describe('getBrandShippingSection: thin passages get the Mela role sentence', () => {
  it('Banjaaran Studio (free shipping, duties in prices) reaches the minimum length', () => {
    const { passage } = section({ duties: 'ddp', method: 'free' }, 'Banjaaran Studio');
    expect(passage).toBe(
      "Banjaaran Studio ships to US addresses with free shipping. Banjaaran Studio includes US import duties in its prices, so nothing is due when your order arrives. You pay on Banjaaran Studio's own store, which sets the final cost. Mela links to Banjaaran Studio's store and does not sell, ship or collect duties."
    );
  });

  it('the thinnest states get the longer role sentence', () => {
    expect(section({ method: 'flat_rate' }, 'Suta').passage).toBe(
      "Suta ships to US addresses. Suta hasn't confirmed whether its prices include US import duties. You pay on Suta's own store, which sets the final cost. Mela links to Suta's store and does not sell, ship or collect duties. Questions about an order go to Suta, not to Mela."
    );
  });

  it('longer states do not get a role sentence', () => {
    expect(
      section(
        { duties: 'ddu', method: 'calculated_free_over_threshold', freeOverUsd: 199 },
        'House of Chikankari'
      ).passage
    ).not.toMatch(/Mela links/);
  });
});

describe('getBrandShippingSection: FAQ', () => {
  it('has the three questions with the PRD duty openers for a fresh DDP brand with a threshold', () => {
    const { faq } = section({
      duties: 'ddp',
      method: 'flat_rate_free_over_threshold',
      feeUsd: 30,
      freeOverUsd: 150,
    });
    expect(faq.map(item => item.question)).toEqual([
      'Does Nicobar ship to the US?',
      'Will I pay import duties on Nicobar orders?',
      'Does Nicobar offer free shipping to the US?',
    ]);
    expect(faq[0].answer).toBe('Nicobar ships to the US for $30, free on orders over $150.');
    expect(faq[1].answer).toBe(
      'No. Nicobar includes US import duties in its prices, so nothing is due when your order arrives.'
    );
    expect(faq[2].answer).toBe('Yes, on orders over $150. Below that, Nicobar charges $30.');
  });

  it.each([
    [
      'DDP at checkout',
      { duties: 'ddp', dutiesCollected: 'at_checkout', method: 'flat_rate' },
      'Yes, at checkout. Nicobar adds US import duties to its order total, so nothing is due on delivery.',
    ],
    [
      'DDU',
      { duties: 'ddu', method: 'flat_rate' },
      "Yes. Nicobar's prices don't include US import duties, so the courier collects any duty owed before delivery. Mela can't estimate the amount.",
    ],
    [
      'unknown',
      { method: 'flat_rate' },
      "Nicobar hasn't confirmed whether its prices include US import duties.",
    ],
  ])('duty answer opener for %s', (name, data, expected) => {
    expect(section(data).faq[1].answer).toBe(expected);
  });

  it('adds the ships-from sentence only when shipsFrom is set', () => {
    const base = { duties: 'ddu', method: 'flat_rate', feeUsd: 8 };
    expect(section(base, 'Tarinika').faq[0].answer).toBe('Tarinika ships to the US for $8.');
    expect(section({ ...base, shipsFrom: 'mixed' }, 'Tarinika').faq[0].answer).toBe(
      'Tarinika ships to the US for $8. Its orders ship from India or a US warehouse.'
    );
    expect(
      section({ ...base, shipsFrom: 'us_warehouse' }, 'Daughters of India').faq[0].answer
    ).toContain('Its orders ship from a US warehouse.');
    expect(section({ ...base, shipsFrom: 'india' }).faq[0].answer).toContain(
      'Its orders ship from India.'
    );
  });

  it('asks about free shipping only when a threshold or free shipping is known', () => {
    expect(section({ method: 'flat_rate', feeUsd: 34 }).faq).toHaveLength(2);
    expect(section({ method: 'calculated_at_checkout' }).faq).toHaveLength(2);
    expect(section({ method: 'flat_rate_free_over_threshold', feeUsd: 20 }).faq).toHaveLength(2);
    expect(section({ method: 'free' }).faq[2].answer).toBe('Yes. Nicobar ships free to the US.');
    expect(
      section({ method: 'calculated_free_over_threshold', freeOverUsd: 199 }, 'Hemant & Nandita')
        .faq[2].answer
    ).toBe(
      "Yes, on orders over $199. Below that, Hemant & Nandita's checkout shows the shipping cost."
    );
  });

  it('no data or stale data: neutral first FAQ item only', () => {
    [null, { method: 'flat_rate', checkedAt: '2025-01-01' }, { method: 'flat_rate' }].forEach(
      data => {
        const { faq, byline } = getBrandShippingSection(data, 'Isharya', intl, NOW);
        expect(faq).toEqual([
          {
            id: 'ships',
            question: 'Does Isharya ship to the US?',
            answer: 'Isharya sets shipping and duties at its checkout.',
          },
        ]);
        expect(byline).toBeNull();
      }
    );
  });

  it('method none: first item only, says the brand does not ship yet', () => {
    const { faq, state } = section({ method: 'none' }, 'Pluchi');
    expect(state).toBe('none');
    expect(faq).toHaveLength(1);
    expect(faq[0].answer).toBe("Pluchi doesn't ship to the US yet.");
  });
});

describe('getBrandShippingSection: byline (brand page only, fresh only)', () => {
  it('formats the checked date as Month D, YYYY', () => {
    expect(section({ method: 'free', checkedAt: '2026-10-04' }).byline).toBe(
      'Shipping details checked October 4, 2026 · Curated by the Mela team'
    );
    expect(section({ method: 'free', checkedAt: '2026-09-09' }).byline).toBe(
      'Shipping details checked September 9, 2026 · Curated by the Mela team'
    );
  });

  it('is not shown for stale data', () => {
    expect(section({ method: 'free', checkedAt: '2025-01-01' }).byline).toBeNull();
  });
});

describe('brand page FAQPage JSON-LD (P1.8)', () => {
  const organizationRef = { '@id': 'https://www.shopatmela.com#organization' };

  it.each(BRANDS)('%s: JSON-LD text equals the visible FAQ text exactly', (brand, data) => {
    const { faq } = section(data, brand);
    const schema = buildBrandFaqSchema(faq, organizationRef);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.map(q => [q.name, q.acceptedAnswer.text])).toEqual(
      faq.map(item => [item.question, item.answer])
    );
  });

  it('references the marketplace Organization as author and publisher without duplicating it', () => {
    const schema = buildBrandFaqSchema(section({ method: 'free' }).faq, organizationRef);
    expect(schema.author).toEqual(organizationRef);
    expect(schema.publisher).toEqual(organizationRef);
    expect(Object.keys(schema.author)).toEqual(['@id']);
  });

  it('uses the typed Question and Answer nodes', () => {
    const schema = buildBrandFaqSchema(section({ method: 'free' }).faq, organizationRef);
    schema.mainEntity.forEach(q => {
      expect(q['@type']).toBe('Question');
      expect(q.acceptedAnswer['@type']).toBe('Answer');
    });
  });
});

describe('getBrandHeroShipping (P1.6)', () => {
  const hero = data => getBrandHeroShipping({ checkedAt: FRESH, ...data }, NOW);

  it('ships for any known method except none', () => {
    ['free', 'flat_rate', 'calculated_at_checkout'].forEach(method =>
      expect(hero({ method })).toEqual({ ships: true, doesNotShip: false, dutiesIncluded: false })
    );
  });

  it('adds duties included for DDP in either collection mode only', () => {
    expect(hero({ method: 'flat_rate', duties: 'ddp' }).dutiesIncluded).toBe(true);
    expect(
      hero({ method: 'flat_rate', duties: 'ddp', dutiesCollected: 'at_checkout' }).dutiesIncluded
    ).toBe(true);
    expect(hero({ method: 'flat_rate', duties: 'ddu' }).dutiesIncluded).toBe(false);
    expect(hero({ method: 'flat_rate' }).dutiesIncluded).toBe(false);
  });

  it('method none does not ship', () => {
    expect(hero({ method: 'none', duties: 'ddp' })).toEqual({
      ships: false,
      doesNotShip: true,
      dutiesIncluded: false,
    });
  });

  it('fails closed for no data, stale data and a missing method', () => {
    const none = { ships: false, doesNotShip: false, dutiesIncluded: false };
    expect(getBrandHeroShipping(null, NOW)).toEqual(none);
    expect(getBrandHeroShipping({ method: 'flat_rate', duties: 'ddp' }, NOW)).toEqual(none);
    expect(getBrandHeroShipping({ method: 'flat_rate', checkedAt: '2025-01-01' }, NOW)).toEqual(
      none
    );
    expect(hero({ duties: 'ddp' })).toEqual(none);
  });
});

describe('getTrustSheetShippingLines (P1.5), exact strings per method x duties', () => {
  const lines = data => getTrustSheetShippingLines({ checkedAt: FRESH, ...data }, intl, NOW);

  it.each([
    [{ method: 'free' }, 'Ships free to the US'],
    [{ method: 'flat_rate', feeUsd: 34, feeApprox: true }, 'Ships to the US for about $34'],
    [{ method: 'flat_rate' }, 'Ships to the US'],
    [
      { method: 'flat_rate_free_over_threshold', feeUsd: 15, freeOverUsd: 100 },
      'Ships to the US for $15, free on orders over $100',
    ],
    [
      { method: 'flat_rate_free_over_threshold', feeUsd: 51, feeApprox: true },
      'Ships to the US for about $51, larger orders may ship free',
    ],
    [
      { method: 'flat_rate_free_over_threshold', freeOverUsd: 69 },
      'Ships free to the US on orders over $69',
    ],
    [{ method: 'calculated_at_checkout' }, 'Ships to the US, its checkout shows the shipping cost'],
    [
      { method: 'calculated_free_over_threshold', freeOverUsd: 150 },
      'Ships free to the US on orders over $150, its checkout shows the cost below that',
    ],
    [
      { method: 'calculated_free_over_threshold' },
      'Ships to the US, its checkout shows the shipping cost',
    ],
  ])('shipping item for %j', (data, expected) => {
    expect(lines(data).shipping).toBe(expected);
  });

  it.each([
    [{ duties: 'ddp' }, 'Duties are included in the price'],
    [{ duties: 'ddp', dutiesCollected: 'in_price' }, 'Duties are included in the price'],
    [{ duties: 'ddp', dutiesCollected: 'at_checkout' }, 'US import duties are added at checkout'],
    [{ duties: 'ddu' }, 'US import duties are paid on delivery'],
    [{}, "The brand doesn't say if US duties are included"],
    [{ duties: 'maybe' }, "The brand doesn't say if US duties are included"],
  ])('duties item for %j', (duties, expected) => {
    expect(lines({ method: 'flat_rate', ...duties }).duties).toBe(expected);
  });

  it('never repeats the brand name and never says "DDP" or "DDU"', () => {
    const all = BRANDS.flatMap(([, data]) => Object.values(lines(data)));
    all.filter(Boolean).forEach(text => {
      expect(text).not.toMatch(/\bDD[PU]\b/);
      expect(text).not.toMatch(/[-–—]/);
    });
  });

  it('method none: does not ship, no duties item', () => {
    expect(lines({ method: 'none', duties: 'ddu' })).toEqual({
      shipping: "Doesn't ship to the US yet",
      duties: null,
    });
  });

  it.each([
    null,
    undefined,
    {},
    { method: 'flat_rate' },
    { method: 'flat_rate', checkedAt: '2025-01-01' },
  ])('no usable data (%j): neutral item, no duties item', data => {
    expect(getTrustSheetShippingLines(data, intl, NOW)).toEqual({
      shipping: "Shipping and duties are set at the brand's checkout",
      duties: null,
    });
  });
});

describe('getDutiesTooltip', () => {
  it('explains DDP in price and DDU, and nothing else', () => {
    expect(getDutiesTooltip('ddp_in_price', 'Nicobar', intl)).toBe(
      'Nicobar includes US import duties in its prices, so nothing is due when your order arrives.'
    );
    expect(getDutiesTooltip('ddu', 'House of Chikankari', intl)).toBe(
      "House of Chikankari's prices don't include US import duties. The courier collects them before delivery. Mela can't estimate the amount."
    );
    expect(getDutiesTooltip('ddp_at_checkout', 'Vilvah Store', intl)).toBeNull();
    expect(getDutiesTooltip('unknown', 'Ankid', intl)).toBeNull();
    expect(getDutiesTooltip(null, 'Ankid', intl)).toBeNull();
  });
});

describe('copy rules for the Stage 3 templates', () => {
  const keys = Object.keys(enMessages).filter(
    key =>
      key.startsWith('BrandPassage.') ||
      key.startsWith('BrandShipping.') ||
      key.startsWith('RedirectTrustSheet.shipping.') ||
      /^RedirectTrustSheet\.(duties|trustCheckout)/.test(key)
  );

  it.each(keys)('%s has no dash characters, DDP or DDU terms, "Indian" or threshold math', key => {
    const value = enMessages[key];
    expect(value).not.toMatch(/[-–—]/);
    expect(value).not.toMatch(/\bDD[PU]\b/);
    expect(value).not.toMatch(/\bIndian\b/);
    expect(value).not.toMatch(/this item|your cart|you.re \$/i);
  });

  it('the superseded P0 keys and the old estimate keys are gone', () => {
    [
      'RedirectTrustSheet.trustShippingShips',
      'RedirectTrustSheet.trustShippingNone',
      'RedirectTrustSheet.trustShippingUnknown',
      'RedirectTrustSheet.trustDutiesDdp',
      'RedirectTrustSheet.trustDutiesDdpAtCheckout',
      'RedirectTrustSheet.trustDutiesDdu',
      'RedirectTrustSheet.trustDutiesUnknown',
      'OrderPanel.inrEquivalent',
      'OrderPanel.priceConvertedDisclaimer',
      'OrderPanel.priceConvertedDisclaimerNoBrand',
      'BrandStorefront.metaCards',
    ].forEach(key => expect(enMessages[key]).toBeUndefined());
  });

  it('nothing says "US cards accepted"', () => {
    expect(
      JSON.stringify(Object.values(enMessages).filter(v => /US cards accepted/i.test(v)))
    ).toBe('[]');
  });
});
