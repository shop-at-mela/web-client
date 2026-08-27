/**
 * giftingContent.js
 *
 * Per-route copy + SEO metadata for GiftingPage (`/gifts` and `/occasions/:occasionSlug`).
 * Kept data-only — no config/env reads here — so GiftingPage.js is the single place that
 * resolves absolute URLs (e.g. config.marketplaceRootURL for an OG image), per
 * gifting-festival-traffic-prd.md Day 2 Phase 1 ("no inline env literals" in this file).
 */

// Occasions with hand-written landing copy — the near-term festival sequence
// (gifting-festival-traffic-prd.md's Shopper-behavior model: Pinterest's 6-8wk lead time
// means these need to be live before copy can be written for every enum value). Any other
// occasion slug in configListing.js's `occasion` enumOptions still renders a working page —
// see getGiftingContent's generic fallback below — so adding a new occasion value never
// produces a blank/broken /occasions/:slug page while it waits for curated copy.
const OCCASION_LANDING_CONTENT = {
  diwali: {
    heading: 'Diwali Gifts',
    subheading: 'Curated Diwali gifts from independent Indian brands — diyas to festive wear.',
    metaDescription:
      "Shop Diwali gifts from independent Indian brands: home décor, festive fashion, and gourmet hampers, ethically made and shipped to the US.",
  },
  'diwali-festivals': {
    heading: 'Diwali & Festival Gifts',
    subheading: 'Festive wear, décor, and gifts for Diwali and the festival season.',
    metaDescription:
      'Shop Diwali and festival-season gifts from independent Indian brands, shipped to the US.',
  },
  navratri: {
    heading: 'Navratri Gifts',
    subheading: 'Vibrant Navratri-ready fashion and gifting picks from independent Indian designers.',
    metaDescription:
      'Shop Navratri gifts and festive fashion from independent Indian brands, shipped to the US.',
  },
  karva_chauth: {
    heading: 'Karva Chauth Gifts',
    subheading: 'Thoughtful Karva Chauth gifts — jewelry, fashion, and self-care from Indian brands.',
    metaDescription: 'Shop Karva Chauth gifts from independent Indian brands, shipped to the US.',
  },
  raksha_bandhan: {
    heading: 'Raksha Bandhan Gifts',
    subheading: 'Gifts for siblings this Raksha Bandhan, from independent Indian brands.',
    metaDescription: 'Shop Raksha Bandhan gifts from independent Indian brands, shipped to the US.',
  },
  bhai_dooj: {
    heading: 'Bhai Dooj Gifts',
    subheading: 'Gifts for Bhai Dooj, from independent Indian brands.',
    metaDescription: 'Shop Bhai Dooj gifts from independent Indian brands, shipped to the US.',
  },
  wedding: {
    heading: 'Wedding Gifts',
    subheading: 'Wedding and wedding-guest gifts from independent Indian brands.',
    metaDescription: 'Shop wedding gifts from independent Indian brands, shipped to the US.',
  },
};

// Fallback for /gifts (no occasionSlug) — the broad, always-on gifting landing.
const DEFAULT_GIFTING_CONTENT = {
  heading: 'Gifts',
  subheading: 'Curated gifts from independent Indian brands, for every celebration.',
  metaDescription:
    'Shop curated gifts from independent Indian brands — home décor, fashion, jewelry, and more, shipped to the US.',
};

// "Under $X" price bands — value is the `price` query param (min,max in whole currency
// units, matching config/configSearch.js's priceFilter format), not subunits.
export const GIFT_PRICE_BANDS = [
  { label: 'Under $25', priceParam: '0,25' },
  { label: 'Under $50', priceParam: '0,50' },
  { label: 'Under $100', priceParam: '0,100' },
];

// Curated subset of configListing.js's `recipient` enumOptions — the full 10-value list
// is too many chips for a single row; these are the highest-signal gifting recipients.
// Query lights up once Day 1's `flex-cli search set --key recipient` has run
// (gifting-festival-traffic-prd.md §1G) — until then it silently returns unfiltered results.
export const GIFT_RECIPIENT_CHIPS = [
  { option: 'for_mom', label: 'For Mom' },
  { option: 'for_dad', label: 'For Dad' },
  { option: 'for_couple', label: 'For Couple' },
  { option: 'for_kids', label: 'For Kids' },
  { option: 'for_baby', label: 'For Baby' },
  { option: 'for_host', label: 'For Host' },
];

/**
 * @param {string|undefined} occasionSlug
 * @param {(slug: string) => string} getLabel - slug→label lookup, see util/occasionLabels.js
 * @returns {{heading: string, subheading: string, metaDescription: string}}
 */
export const getGiftingContent = (occasionSlug, getLabel) => {
  if (!occasionSlug) return DEFAULT_GIFTING_CONTENT;

  const curated = OCCASION_LANDING_CONTENT[occasionSlug];
  if (curated) return curated;

  // Generic template for any occasion slug that doesn't have hand-written copy yet.
  const label = getLabel(occasionSlug);
  return {
    heading: `${label} Gifts`,
    subheading: `Curated ${label} gifts from independent Indian brands.`,
    metaDescription: `Shop ${label} gifts from independent Indian brands, shipped to the US.`,
  };
};
