/**
 * Brand US shipping fixtures shared by the brandShipping tests: the seeded profiles as of
 * 2026-10-04 (dev) plus the PRD Appendix B brands. Amounts are USD. No `checkedAt` here:
 * tests add a fresh date so the same data works on any day.
 */
// Seeded profiles as of 2026-10-04 (dev), plus the PRD Appendix B brands. Amounts are USD.
export const BRANDS = [
  ['The Nesavu', { duties: 'ddu', method: 'flat_rate', feeUsd: 40, feeApprox: true }],
  ['SuperBottoms', { duties: 'ddu', method: 'calculated_at_checkout' }],
  [
    'Nicobar',
    { duties: 'ddp', method: 'flat_rate_free_over_threshold', feeUsd: 30, freeOverUsd: 150 },
  ],
  ['House of Chikankari', { duties: 'ddu', method: 'flat_rate', feeUsd: 34, feeApprox: true }],
  ['Ankid', { method: 'flat_rate', feeUsd: 28, feeApprox: true }],
  [
    'Fizzy Goblet',
    { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 15, freeOverUsd: 100 },
  ],
  [
    'Kaunteya',
    { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 51, feeApprox: true },
  ],
  ['Masilo', { method: 'calculated_at_checkout' }],
  ['Aagghhoo', { method: 'calculated_at_checkout' }],
  ['Baby Forest', { method: 'calculated_at_checkout' }],
  ['ChooseKind', { method: 'calculated_free_over_threshold', freeOverUsd: 150 }],
  ['Gully Labs', { duties: 'ddp', method: 'flat_rate', feeUsd: 68, feeApprox: true }],
  ['The Alternate India', { method: 'flat_rate', feeUsd: 23, feeApprox: true }],
  ['Banjaaran Studio', { duties: 'ddp', method: 'free' }],
  [
    'Tarinika',
    { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 7.99, freeOverUsd: 99 },
  ],
  [
    'Isharya',
    { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 20, freeOverUsd: 250 },
  ],
  [
    'Vilvah Store',
    {
      duties: 'ddp',
      dutiesCollected: 'at_checkout',
      method: 'flat_rate_free_over_threshold',
      freeOverUsd: 69,
    },
  ],
  ['Polite Society', { duties: 'ddu', method: 'flat_rate', feeUsd: 28, feeApprox: true }],
  ['Suta', { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 20 }],
  [
    'Little Muffet',
    { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 20, freeOverUsd: 200 },
  ],
  [
    'Needledust',
    {
      duties: 'ddu',
      method: 'flat_rate_free_over_threshold',
      feeUsd: 45,
      feeApprox: true,
      freeOverUsd: 227,
      freeOverApprox: true,
    },
  ],
  ['Saphed', { duties: 'ddu', method: 'free' }],
  [
    'Daughters of India',
    { duties: 'ddp', method: 'flat_rate_free_over_threshold', feeUsd: 12, freeOverUsd: 380 },
  ],
  [
    'Hemant & Nandita',
    { duties: 'ddp', method: 'calculated_free_over_threshold', freeOverUsd: 199 },
  ],
  ['Pluchi', { method: 'none' }],
];
