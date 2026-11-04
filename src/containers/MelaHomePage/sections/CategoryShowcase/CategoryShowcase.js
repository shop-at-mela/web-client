import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ProductCarousel, NamedLink } from '../../../../components';
import OccasionCard from '../../../../components/OccasionCard/OccasionCard';
import { useConfiguration } from '../../../../context/configurationContext';
import { denormalisedEntities, updatedEntities, pickBrandDiverse } from '../../../../util/data';
import { fetchListingsAcrossBrands } from '../../../../util/bestsellerCarousel';
import { allBrandIds, getBrandSlugById } from '../../../../config/configBrands';
import sdk from '../../../../util/homepageSdk';
import {
  pushMosaicImpression,
  pushMosaicTileClick,
} from '../../../../util/analytics/occasionMosaic';
// Re-exported for discoverability (ListingCard's occasion chips, GiftingPage) — implemented
// in util/occasionLabels.js rather than here to avoid a circular import: this file pulls in
// the `components` barrel below (for ProductCarousel), which re-exports ListingCard.
export { getOccasionLabel, OCCASION_LABELS } from '../../../../util/occasionLabels';

import css from './CategoryShowcase.module.css';

// ── Occasion config ────────────────────────────────────────────────────────
// The full near-term festival sequence (gifting-festival-traffic-prd.md's Shopper-behavior
// model: Raksha Bandhan → Navratri → Karva Chauth → Diwali → Bhai Dooj → wedding season),
// plus the evergreen 'gifting' catch-all. 7 occasions is too many panels to show at once —
// getActiveSeasonOccasion() below picks which 2-3 are relevant "today".

// Exported so other surfaces (e.g. BrandOccasionModule on the brand storefront)
// reuse the same occasion copy/config instead of redefining it.
export const OCCASIONS = [
  {
    option: 'gifting',
    label: 'Gifting',
    description: 'Curated gifts for baby showers, naming ceremonies, and first milestones',
    cta: 'Shop Gifts',
    colorTheme: 'gifting',
    matchValues: ['gifting'],
  },
  {
    option: 'raksha_bandhan',
    label: 'Raksha Bandhan',
    description: 'Gifts for siblings this Raksha Bandhan',
    cta: 'Shop Raksha Bandhan',
    colorTheme: 'festive',
    matchValues: ['raksha_bandhan'],
  },
  {
    option: 'navratri',
    label: 'Navratri',
    description: 'Festive fashion and gifting picks for Navratri',
    cta: 'Shop Navratri',
    colorTheme: 'festive',
    matchValues: ['navratri'],
  },
  {
    option: 'karva_chauth',
    label: 'Karva Chauth',
    description: 'Jewelry, fashion, and gifts for Karva Chauth',
    cta: 'Shop Karva Chauth',
    colorTheme: 'festive',
    matchValues: ['karva_chauth'],
  },
  {
    option: 'diwali',
    label: 'Diwali & Festivals',
    description: 'Indian festive wear, artisan toys, and gifts for every celebration',
    cta: 'Shop for Diwali',
    colorTheme: 'festive',
    // 'diwali-festivals' is the legacy pre-broadened-enum value already tagged on existing
    // inventory (see configListing.js) — matched too so this panel isn't empty pre-backfill.
    matchValues: ['diwali', 'diwali-festivals'],
  },
  {
    option: 'bhai_dooj',
    label: 'Bhai Dooj',
    description: 'Gifts for Bhai Dooj',
    cta: 'Shop Bhai Dooj',
    colorTheme: 'festive',
    // Shown under the label on the homepage mosaic tile, for shoppers who don't know the festival
    tileSubtitle: 'Gifts for siblings',
    matchValues: ['bhai_dooj'],
  },
  {
    option: 'wedding',
    label: 'Wedding Season',
    description: 'Wedding and wedding-guest gifts from independent Indian brands',
    cta: 'Shop Wedding Gifts',
    colorTheme: 'festive',
    matchValues: ['wedding'],
  },
];

// Festival dates, keyed by year because the lunar-calendar festivals move every year. The
// season math below never crosses the Dec 31 → Jan 1 boundary (Raksha Bandhan in August
// through Bhai Dooj in November). Verify against a panchang and add the next year's entry
// before January — a test fails once the current year has no entry. Until then a year with no
// entry reuses the latest known year's dates, which are only approximately right.
// See gifting-festival-traffic-prd.md's Timing note; the 2026 values are estimates.
export const FESTIVAL_DATES_BY_YEAR = {
  2026: {
    raksha_bandhan: { month: 8, day: 28 },
    navratri: { month: 10, day: 11 },
    karva_chauth: { month: 10, day: 29 },
    diwali: { month: 11, day: 8 },
    bhai_dooj: { month: 11, day: 10 },
  },
};

const FESTIVAL_OPTIONS = Object.keys(FESTIVAL_DATES_BY_YEAR[2026]);

const festivalDatesForYear = year => {
  if (FESTIVAL_DATES_BY_YEAR[year]) return FESTIVAL_DATES_BY_YEAR[year];
  const latest = Math.max(...Object.keys(FESTIVAL_DATES_BY_YEAR).map(Number));
  return FESTIVAL_DATES_BY_YEAR[latest];
};

// Shoppers plan gifting occasions weeks ahead on Pinterest (Shopper-behavior model:
// "boards built 6-8wks ahead") — a panel goes "in season" this many days before its
// festival date, and stays up this many days after for last-minute shoppers.
const SEASON_LEAD_DAYS = 21;
const SEASON_LAG_DAYS = 3;

const dayOfYear = date => {
  const startOfYear = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((current - startOfYear) / 86400000);
};

const festivalDayOfYear = (option, year) => {
  const { month, day } = festivalDatesForYear(year)[option];
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000);
};

// Signed day-distance from `date` to this year's occurrence of `option`'s festival date —
// negative means the festival already happened this year.
const daysUntilFestival = (option, date) =>
  festivalDayOfYear(option, date.getFullYear()) - dayOfYear(date);

const isFestivalInSeason = (option, date) => {
  const distance = daysUntilFestival(option, date);
  return distance <= SEASON_LEAD_DAYS && distance >= -SEASON_LAG_DAYS;
};

const isWeddingSeason = date => [11, 12, 1, 2].includes(date.getMonth() + 1);

// Every dated festival currently in season, plus 'wedding' during wedding season — uncapped,
// unlike getActiveSeasonOccasion(), so the mosaic can rotate through all of them.
const getInSeasonOccasions = date => {
  const inSeasonDated = FESTIVAL_OPTIONS.filter(option => isFestivalInSeason(option, date));
  return isWeddingSeason(date) ? [...inSeasonDated, 'wedding'] : inSeasonDated;
};

/**
 * Picks which occasion options OccasionStrip should render "today", in display order:
 * when a festival is in season (or it's wedding season, Nov-Feb), that festival leads —
 * up to 2 of them — with the evergreen 'gifting' panel trailing. If nothing is currently in
 * season, falls back to gifting leading plus the single nearest-upcoming dated festival, so
 * the strip is never just one panel wide. Never returns more than 3 options.
 * @param {Date} [date] - defaults to now; a param mainly for testability.
 * @returns {Array<string>} OCCASIONS option keys, in display order.
 */
export const getActiveSeasonOccasion = (date = new Date()) => {
  const datedOptions = FESTIVAL_OPTIONS;
  const inSeason = getInSeasonOccasions(date);

  if (inSeason.length > 0) {
    return [...inSeason.slice(0, 2), 'gifting'];
  }

  // Off-season: gifting leads, plus the single nearest-upcoming dated festival.
  // Already-passed festivals wrap around to "next year" (add 365) so they sort behind
  // whatever's upcoming instead of looking closer just because their raw distance is a
  // small negative number.
  const nearest = [...datedOptions].sort((a, b) => {
    const da = daysUntilFestival(a, date);
    const db = daysUntilFestival(b, date);
    return (da < 0 ? da + 365 : da) - (db < 0 ? db + 365 : db);
  })[0];

  return ['gifting', nearest];
};

// Max listings fetched per brand for the fetchListingsAcrossBrands query-time
// diversity strategy (see util/bestsellerCarousel.js) — shared across all three
// carousels below. With ~18 configured brands this yields plenty of buffer over
// each carousel's DISPLAY_COUNT even after client-side filtering/misses.
const PER_BRAND_COUNT = 2;

// Brands to leave out of the homepage discovery carousels (OccasionStrip,
// AgeNavigation, AllCategoryCarousels) specifically — their listings still show
// up everywhere else (search, category pages, their own /brands/:slug storefront).
// Keyed by slug rather than UUID so this stays readable/editable without looking
// up IDs in configBrands.js. Exported so a test can assert against configBrands.js's
// real slugs and catch a typo here silently no-opping the exclusion.
export const EXCLUDED_DISCOVERY_BRAND_SLUGS = ['superbottoms', 'isharya'];
const DISCOVERY_BRAND_IDS = allBrandIds.filter(
  id => !EXCLUDED_DISCOVERY_BRAND_SLUGS.includes(getBrandSlugById(id))
);

const TOP_AGE_GROUPS = [
  { option: 'newborn',     label: 'Newborn' },
  { option: '0_6_months',  label: '0-6 Months' },
  { option: '6_12_months', label: '6-12 Months' },
];

// P1.3: homepage-editorial-modules.md's revised section order keeps only Fashion and
// Baby & Kids as standalone product carousels here — Home & Kitchen, Jewelry &
// Accessories, Beauty & Wellness, and Art & Craft are still fully reachable via the
// hero's category chips and /categories, just no longer duplicated as homepage rows
// ("eight product carousels become two"). Order matches the spec's row 5→6 (Fashion,
// then Baby & Kids).
const ALL_CATEGORIES = [
  { id: 'Fashion',   label: 'Indian Fashion', viewAllSearch: '?pub_categoryLevel1=Fashion' },
  { id: 'Baby-Kids', label: 'Baby & Kids',    viewAllSearch: '?pub_categoryLevel1=Baby-Kids' },
];

// ── Get categories for showcase ────────────────────────────────────────────

const getShowcaseCategories = (categoryConfig) => {
  if (!categoryConfig || !Array.isArray(categoryConfig)) return [];

  const showcaseCategories = [];
  categoryConfig.forEach(topCategory => {
    if (topCategory.subcategories && topCategory.subcategories.length > 0) {
      showcaseCategories.push(...topCategory.subcategories);
    }
  });

  return showcaseCategories.slice(0, 3);
};

// ── Structured data for SEO ────────────────────────────────────────────────

const generateStructuredData = (categories, categoryProducts) => {
  const itemListElements = categories.flatMap((category, categoryIndex) => {
    const products = categoryProducts[category.id] || [];
    return products.map((product, productIndex) => {
      const currentStock = product.currentStock?.attributes?.quantity || 0;
      const schemaAvailability = !product.currentStock
        ? 'https://schema.org/InStock'
        : currentStock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock';

      return {
        '@type': 'ListItem',
        position: categoryIndex * 4 + productIndex + 1,
        item: {
          '@type': 'Product',
          name: product.attributes.title,
          image: product.images?.[0]?.attributes?.variants?.default?.url || '',
          description: product.attributes.description || `Sustainable ${category.name.toLowerCase()} for babies`,
          offers: {
            '@type': 'Offer',
            price: product.attributes.price?.amount / 100 || 0,
            priceCurrency: product.attributes.price?.currency || 'USD',
            availability: schemaAvailability,
          },
        },
      };
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: itemListElements,
  };
};

// ProductCarouselSection has been extracted to src/components/ProductCarousel/ProductCarousel.js
// AgeNavigation (below) uses the shared ProductCarousel component directly.

// ── OccasionStrip ──────────────────────────────────────────────────────────
// Editorial section, one panel per currently-relevant occasion. Accepts optional
// additionalQueryParams to scope results to a category (used on CategoryPage to show
// occasion products within the current category). Which 2-3 of the 7 configured OCCASIONS
// render is decided by getActiveSeasonOccasion() — 'gifting' is always included, plus
// whichever festivals are in-season (or the nearest upcoming one, off-season).

export const OccasionStrip = ({ config, additionalQueryParams = {} }) => {
  // Computed once per mount, matching the original isDiwaliSeason() call site — the active
  // set doesn't need to re-derive mid-session just because the clock ticks forward.
  const activeOptions = getActiveSeasonOccasion();
  const orderedOccasions = activeOptions
    .map(option => OCCASIONS.find(o => o.option === option))
    .filter(Boolean);

  const [occasionProducts, setOccasionProducts] = useState({});
  // Loading is tracked per occasion (not one shared flag) so a slow occasion's
  // fetch never delays a faster sibling's panel from rendering — see the
  // per-occasion effect below.
  const [loadingByOccasion, setLoadingByOccasion] = useState(() =>
    orderedOccasions.reduce((acc, { option }) => ({ ...acc, [option]: true }), {})
  );

  const additionalParamsKey = JSON.stringify(additionalQueryParams);
  const activeOptionsKey = activeOptions.join(',');
  const DISPLAY_COUNT = 6;

  useEffect(() => {
    const listingFields = config?.listing?.listingFields;
    const sanitizeConfig = { listingFields };

    setLoadingByOccasion(orderedOccasions.reduce((acc, { option }) => ({ ...acc, [option]: true }), {}));

    // Fire each occasion's fetch independently (not inside a shared Promise.all)
    // and update only that occasion's slice of state on completion, so whichever
    // occasion responds first renders first instead of both waiting on the
    // slower of the two. fetchListingsAcrossBrands additionally bounds each
    // per-brand request within a single occasion's fetch (see PER_BRAND_TIMEOUT_MS
    // in util/bestsellerCarousel.js).
    orderedOccasions.forEach(({ option, matchValues }) => {
      (async () => {
        try {
          // Query-time diversity: fetch a couple of listings from every configured
          // brand rather than one marketplace-wide query, so one brand's inventory
          // can't monopolize the pool before diversification even gets a chance.
          // has_any: lets an occasion match more than one publicData.occasion value
          // (e.g. 'diwali' also matches the legacy 'diwali-festivals' tag).
          const { pool, allIncluded } = await fetchListingsAcrossBrands(
            sdk,
            DISCOVERY_BRAND_IDS,
            {
              pub_occasion: `has_any:${matchValues.join(',')}`,
              include: ['author', 'images', 'currentStock'],
              ...additionalQueryParams,
            },
            PER_BRAND_COUNT
          );

          // Client-side guard: only keep raw listings that actually carry a matching
          // occasion value in publicData. Protects against the pub_occasion search
          // index not being set up in Sharetribe Console (filter silently ignored →
          // all listings returned). Must run BEFORE pickBrandDiverse — diversifying
          // first and filtering after would diversify across the whole unfiltered
          // pool, then collapse back down to whichever single brand happens to have
          // the most occasion-tagged listings once the irrelevant picks are dropped.
          const matchesOccasion = listing => {
            const occasions = listing.attributes?.publicData?.occasion;
            // Handle both storage formats:
            // - array ['gifting'] when ingested with schema-aware parsing
            // - string 'gifting' when ingested before schema config was loaded
            const tags = Array.isArray(occasions) ? occasions : occasions ? [occasions] : [];
            return tags.some(tag => matchValues.includes(tag));
          };

          const occasionTagged = pool.filter(matchesOccasion);
          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              `[OccasionStrip] ${option}: ${pool.length} from API → ${occasionTagged.length} with occasion tag`
            );
          }

          // Pick diverse brands from the occasion-tagged listings only
          const listingIds = pickBrandDiverse(occasionTagged, DISPLAY_COUNT);
          const entities = updatedEntities({}, { data: pool, included: allIncluded }, sanitizeConfig);
          const refs = listingIds.map(id => ({ id, type: 'listing' }));
          const all = denormalisedEntities(entities, refs, false);
          // Defense-in-depth: listingIds were already picked from occasion-tagged,
          // brand-diverse listings above, so this should be a no-op in practice —
          // but re-check here too in case denormalisedEntities resolves a listing
          // whose entity data doesn't match what was in the filtered pool.
          const filtered = all.filter(matchesOccasion);

          setOccasionProducts(prev => ({ ...prev, [option]: filtered }));
        } catch {
          setOccasionProducts(prev => ({ ...prev, [option]: [] }));
        } finally {
          setLoadingByOccasion(prev => ({ ...prev, [option]: false }));
        }
      })();
    });
  }, [additionalParamsKey, activeOptionsKey]); // eslint-disable-line

  const anyLoading = Object.values(loadingByOccasion).some(Boolean);

  // Determine which panels have enough products to show — a still-loading
  // occasion always stays visible (showing its own skeleton) regardless of
  // whether a sibling occasion has already finished.
  const visibleOccasions = orderedOccasions.filter(
    o => loadingByOccasion[o.option] || (occasionProducts[o.option] || []).length >= 2
  );

  // Hide the entire strip only once every occasion has finished loading and
  // none qualifies — never hide while a sibling might still turn out to have
  // enough products.
  if (!anyLoading && visibleOccasions.length === 0) return null;

  // orderedOccasions.length (always 2 or 3, fixed at mount — see
  // getActiveSeasonOccasion) is the MOST panels this grid will ever show:
  // visibleOccasions only shrinks over time as occasions resolve to <2
  // matching listings, never grows. Reserving height for that initial count
  // (via CSS custom properties consumed in .occasionPanels' min-height)
  // stops a later shrink from collapsing the grid and shifting content below
  // it (Lighthouse CLS finding on div.MelaHomePage_occasionSection).
  const occasionPanelsStyle = {
    '--occasion-count': orderedOccasions.length,
    '--occasion-rows': Math.ceil(orderedOccasions.length / 2),
  };

  return (
    <div className={css.occasionStrip}>
      <h3 className={css.ageNavigationTitle}>
        <FormattedMessage id="MelaHomePage.shopByOccasion" defaultMessage="Shop by Occasion" />
      </h3>

      <div className={css.occasionPanels} style={occasionPanelsStyle}>
        {visibleOccasions.map(occasion => {
          const stillLoading = loadingByOccasion[occasion.option];
          const products = occasionProducts[occasion.option] || [];

          // SearchPage URL needs the has_any: prefix for multi-enum fields;
          // the direct SDK query above uses the bare value instead
          const queryParts = {
            pub_occasion: `has_any:${occasion.matchValues.join(',')}`,
            ...additionalQueryParams,
          };
          const viewAllSearch = '?' + new URLSearchParams(queryParts).toString();

          return (
            <OccasionCard
              key={occasion.option}
              label={occasion.label}
              description={occasion.description}
              colorTheme={occasion.colorTheme}
              products={products}
              isLoading={stillLoading}
              ctaLabel={occasion.cta}
              viewAllSearch={viewAllSearch}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── OccasionMosaic ─────────────────────────────────────────────────────────
// Homepage "Shop by occasion" (homepage declutter v3, 2026-10-24): a photo mosaic of
// occasions with no product row under each one. Up to 4 tiles: the 2 occasions nearest in
// time always show (first), the remaining slots are filled at random from the other
// occasions that have enough inventory. Each tile's photo is a random listing tagged with
// that occasion. The chosen tiles are kept for the rest of the browser session so the page
// doesn't reshuffle on Back-navigation (and the listing queries aren't repeated).
// Photos come from one marketplace-wide query per occasion (not the per-brand fan-out
// OccasionStrip uses, which is 19 requests per occasion).

// One cheap request per occasion (a single image variant pair per listing); the tile photo
// is picked at random from these.
const MOSAIC_CANDIDATES_PER_OCCASION = 12;
// An occasion needs at least this many usable photos (right brand, has an image) out of the
// candidates above to be eligible. Low enough that an occasion whose newest listings include
// excluded brands still qualifies; high enough that a tile doesn't show the same one or two
// products on every visit.
const MOSAIC_MIN_INVENTORY = 5;
const MOSAIC_MAX_TILES = 4;
// This many of the nearest occasions are always shown; the rest of the slots are random.
const MOSAIC_FIXED_TILES = 2;
const MOSAIC_QUERY_TIMEOUT_MS = 6000;
const MOSAIC_SESSION_KEY = 'melaOccasionMosaic:v1';

// Same client-side guard as OccasionStrip: the pub_occasion filter is silently ignored if
// the search index isn't set up, so re-check the tag on each listing.
const listingHasOccasion = (listing, matchValues) => {
  const occasions = listing.attributes?.publicData?.occasion;
  const tags = Array.isArray(occasions) ? occasions : occasions ? [occasions] : [];
  return tags.some(tag => matchValues.includes(tag));
};

const occasionSearch = matchValues =>
  '?' + new URLSearchParams({ pub_occasion: `has_any:${matchValues.join(',')}` }).toString();

// Fisher-Yates on a copy; `random` is a param for testability.
export const shuffle = (items, random = Math.random) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Occasions the mosaic may draw from "today", nearest first: in-season festivals by how soon
 * they fall (festivals that just passed, still in their lag window, sort last among them),
 * then wedding season, then the evergreen 'gifting'. Off-season, falls back to
 * getActiveSeasonOccasion()'s gifting + nearest-upcoming pair so the pool is never just one
 * occasion.
 * @param {Date} [date]
 * @returns {Array<string>} OCCASIONS option keys
 */
export const getMosaicOccasionPool = (date = new Date()) => {
  const inSeasonDated = FESTIVAL_OPTIONS.filter(option => isFestivalInSeason(option, date));
  if (inSeasonDated.length === 0 && !isWeddingSeason(date)) return getActiveSeasonOccasion(date);

  const rank = option => {
    const distance = daysUntilFestival(option, date);
    return distance < 0 ? distance + 1000 : distance;
  };
  const dated = [...inSeasonDated].sort((a, b) => rank(a) - rank(b));
  return [...dated, ...(isWeddingSeason(date) ? ['wedding'] : []), 'gifting'];
};

/**
 * Chooses which occasions get a tile, from a pool already in priority order. Only occasions
 * with sizeable inventory are eligible; the first MOSAIC_FIXED_TILES eligible ones are always
 * kept and the remaining slots are drawn at random from the rest. If fewer than 2 occasions
 * clear the inventory bar (e.g. off-season), falls back to any occasion with at least one
 * usable photo rather than showing a near-empty section.
 * @param {Array<string>} pool - OCCASIONS option keys, nearest/most important first
 * @param {Object<string, Array>} candidatesByOption - usable photo candidates per option
 * @param {Function} [random]
 * @returns {Array<string>} chosen option keys, in pool (priority) order
 */
export const selectMosaicOccasions = (pool, candidatesByOption, random = Math.random) => {
  const count = option => (candidatesByOption[option] || []).length;
  let eligible = pool.filter(option => count(option) >= MOSAIC_MIN_INVENTORY);
  if (eligible.length < 2) eligible = pool.filter(option => count(option) > 0);

  const fixed = eligible.slice(0, MOSAIC_FIXED_TILES);
  const random_ = shuffle(eligible.slice(MOSAIC_FIXED_TILES), random).slice(
    0,
    MOSAIC_MAX_TILES - fixed.length
  );
  const chosen = new Set([...fixed, ...random_]);
  return pool.filter(option => chosen.has(option));
};

/**
 * Picks one image per tile in display order. A listing an earlier tile already uses is
 * skipped, so two occasions that share a listing don't show the same photo. A brand an earlier
 * tile already uses is skipped too when another brand is available, because the newest
 * listings are often one brand's drop (e.g. all footwear) and the mosaic should look varied.
 * @param {Array<{option: string}>} occasions in display order
 * @param {Object<string, Array<{listingId: string, brandId?: string, url: string, url2x: string}>>} candidatesByOption
 * @returns {Object<string, {url: string, url2x: string}|null>}
 */
export const pickMosaicImages = (occasions, candidatesByOption) => {
  const usedListings = new Set();
  const usedBrands = new Set();
  return occasions.reduce((acc, { option }) => {
    const unused = (candidatesByOption[option] || []).filter(c => !usedListings.has(c.listingId));
    const pick = unused.find(c => !c.brandId || !usedBrands.has(c.brandId)) || unused[0] || null;
    if (pick) {
      usedListings.add(pick.listingId);
      if (pick.brandId) usedBrands.add(pick.brandId);
    }
    return { ...acc, [option]: pick };
  }, {});
};

// Resolves to `fallback` if the query is still pending after `ms`, so one hung request
// can't keep the whole section on its skeleton.
const withTimeout = (promise, ms, fallback) => {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const fetchMosaicCandidates = async ({ matchValues }) => {
  try {
    const response = await sdk.listings.query({
      pub_occasion: `has_any:${matchValues.join(',')}`,
      perPage: MOSAIC_CANDIDATES_PER_OCCASION,
      include: ['images', 'author'],
      'fields.listing': ['title', 'publicData'],
      'fields.image': ['variants.scaled-medium', 'variants.scaled-large'],
      'fields.user': ['profile.displayName'],
      'limit.images': 1,
    });
    const entities = updatedEntities({}, response.data);
    const refs = response.data.data.map(l => ({ id: l.id, type: 'listing' }));
    return denormalisedEntities(entities, refs, false)
      .filter(l => listingHasOccasion(l, matchValues))
      .filter(l => DISCOVERY_BRAND_IDS.includes(l.author?.id?.uuid))
      .map(l => {
        const variants = l.images?.[0]?.attributes?.variants || {};
        const url = variants['scaled-medium']?.url;
        return url
          ? {
              listingId: l.id.uuid,
              brandId: l.author.id.uuid,
              url,
              url2x: variants['scaled-large']?.url || url,
            }
          : null;
      })
      .filter(Boolean);
  } catch {
    // A failed query counts as an occasion with no usable listings.
    return [];
  }
};

// The session cache stores plain data (option key + photo), keyed by calendar day so a
// stored pick never outlives the day's festival calendar. Storage can be unavailable
// (private mode, SSR) — every access is guarded.
const dayKey = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const readSessionTiles = date => {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(MOSAIC_SESSION_KEY));
    if (!stored || stored.day !== dayKey(date) || !Array.isArray(stored.tiles)) return null;
    const tiles = stored.tiles
      .map(({ option, image }) => ({ occasion: OCCASIONS.find(o => o.option === option), image }))
      .filter(tile => tile.occasion && tile.image?.url);
    return tiles.length > 0 ? tiles : null;
  } catch {
    return null;
  }
};

const writeSessionTiles = (date, tiles) => {
  try {
    window.sessionStorage.setItem(
      MOSAIC_SESSION_KEY,
      JSON.stringify({
        day: dayKey(date),
        tiles: tiles.map(({ occasion, image }) => ({ option: occasion.option, image })),
      })
    );
  } catch {
    // Not persisting just means the next page view re-picks.
  }
};

export const OccasionMosaic = ({ date }) => {
  // Fixed at mount. The pool is deterministic (no randomness), so server and client render
  // the same labelled placeholder tiles from it.
  const [pool] = useState(() =>
    getMosaicOccasionPool(date)
      .map(option => OCCASIONS.find(o => o.option === option))
      .filter(Boolean)
  );
  // null while loading. Randomness lives in the effect (client only), never in render.
  const [tiles, setTiles] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const now = date || new Date();

    const cached = readSessionTiles(now);
    if (cached) {
      setTiles(cached);
      return undefined;
    }

    Promise.all(
      pool.map(occasion =>
        withTimeout(fetchMosaicCandidates(occasion), MOSAIC_QUERY_TIMEOUT_MS, [])
      )
    )
      .then(results => {
        if (cancelled) return;
        // Shuffle each occasion's candidates so pickMosaicImages' first-unused pick is random.
        const candidatesByOption = pool.reduce(
          (acc, { option }, i) => ({ ...acc, [option]: shuffle(results[i]) }),
          {}
        );
        const chosen = selectMosaicOccasions(
          pool.map(o => o.option),
          candidatesByOption
        ).map(option => OCCASIONS.find(o => o.option === option));
        const images = pickMosaicImages(chosen, candidatesByOption);
        const picked = chosen
          .map(occasion => ({ occasion, image: images[occasion.option] }))
          .filter(tile => tile.image);
        if (picked.length > 0) writeSessionTiles(now, picked);
        setTiles(picked);
      })
      .catch(() => {
        if (!cancelled) setTiles([]);
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One impression per tile each time a set of tiles is shown.
  useEffect(() => {
    if (!tiles) return;
    tiles.forEach(({ occasion, image }, index) =>
      pushMosaicImpression(occasion.option, index + 1, tiles.length, image.listingId)
    );
  }, [tiles]);

  // Empty result: nothing to link to, so the section drops out entirely.
  if (tiles && tiles.length === 0) return null;

  // While loading, show the first MOSAIC_MAX_TILES pool occasions as labelled, linked
  // placeholders — real links in the server-rendered HTML for crawlers. The columns follow
  // the tile count so a short row still fills the width; tile height is fixed in CSS
  // (not derived from width), so the final count never changes the row's height.
  const shown = tiles || pool.slice(0, MOSAIC_MAX_TILES).map(occasion => ({ occasion }));

  return (
    <div className={css.mosaicSection}>
      <h2 className={css.mosaicTitle}>
        <FormattedMessage id="MelaHomePage.shopByOccasion" defaultMessage="Shop by Occasion" />
      </h2>
      <div
        className={css.mosaic}
        role="group"
        aria-label="Occasions"
        style={{ '--tile-count': Math.min(shown.length, MOSAIC_MAX_TILES) }}
      >
        {shown.map(({ occasion, image }, index) => (
          <NamedLink
            key={occasion.option}
            name="SearchPage"
            to={{ search: occasionSearch(occasion.matchValues) }}
            className={css.mosaicTile}
            onClick={() =>
              pushMosaicTileClick(occasion.option, index + 1, shown.length, image?.listingId)
            }
          >
            {image ? (
              <img
                className={css.mosaicImage}
                src={image.url}
                srcSet={`${image.url} 750w, ${image.url2x} 1024w`}
                sizes="(min-width: 768px) 25vw, 44vw"
                alt=""
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            ) : null}
            <span className={css.mosaicLabel}>
              <span className={css.mosaicLabelText}>{occasion.label}</span>
              {occasion.tileSubtitle ? (
                <span className={css.mosaicSubtitle}>{occasion.tileSubtitle}</span>
              ) : null}
            </span>
          </NamedLink>
        ))}
      </div>
    </div>
  );
};

// ── AgeNavigation ──────────────────────────────────────────────────────────
// Age-based product carousels (top 3 groups).
// Uses the shared ProductCarousel component (same pattern as listing page modules).

// Exported (P1.3): the "Shop Baby by Age" block moved off the homepage to the Baby &
// Kids category page (a family-era relic that contradicted the resolved "all categories
// equal" positioning on the homepage) — CategoryPage.js renders it directly now.
export const AgeNavigation = ({ config }) => {
  const [ageProducts, setAgeProducts] = useState({});
  // Loading tracked per age group so a slow group never delays a faster
  // sibling's carousel from rendering (ProductCarousel takes isLoading per instance).
  const [loadingByAgeGroup, setLoadingByAgeGroup] = useState(() =>
    TOP_AGE_GROUPS.reduce((acc, { option }) => ({ ...acc, [option]: true }), {})
  );

  const DISPLAY_COUNT = 8;

  useEffect(() => {
    const listingFields = config?.listing?.listingFields;
    const sanitizeConfig = { listingFields };

    // Fire each age group's fetch independently and update only its own slice
    // of state on completion — see the matching pattern/rationale in OccasionStrip.
    TOP_AGE_GROUPS.forEach(({ option }) => {
      (async () => {
        try {
          const { pool, allIncluded } = await fetchListingsAcrossBrands(
            sdk,
            DISCOVERY_BRAND_IDS,
            {
              pub_age_group: option,
              include: ['author', 'images', 'currentStock'],
            },
            PER_BRAND_COUNT
          );

          // Pick diverse brands from the pool
          const listingIds = pickBrandDiverse(pool, DISPLAY_COUNT);
          const entities = updatedEntities({}, { data: pool, included: allIncluded }, sanitizeConfig);
          const refs = listingIds.map(id => ({ id, type: 'listing' }));
          const listings = denormalisedEntities(entities, refs, false);

          setAgeProducts(prev => ({ ...prev, [option]: listings }));
        } catch {
          setAgeProducts(prev => ({ ...prev, [option]: [] }));
        } finally {
          setLoadingByAgeGroup(prev => ({ ...prev, [option]: false }));
        }
      })();
    });
  }, []); // eslint-disable-line

  return (
    <div className={css.ageNavigation}>
      <h3 className={css.ageNavigationTitle}>
        <FormattedMessage id="MelaHomePage.shopByAge" defaultMessage="Shop Baby by Age" />
      </h3>
      <div className={css.categorySections}>
        {TOP_AGE_GROUPS.map(({ option, label }) => (
          <ProductCarousel
            key={option}
            title={label}
            viewAllLinkName="SearchPage"
            viewAllLinkSearch={`?pub_categoryLevel1=Baby-Clothes-Accessories&pub_age_group=${option}`}
            listings={ageProducts[option] || []}
            isLoading={loadingByAgeGroup[option]}
          />
        ))}
      </div>
      <div className={css.viewAll}>
        <Link to="/categories/Baby-Kids" className={css.viewAllButton}>
          <FormattedMessage id="MelaHomePage.seeAllAges" defaultMessage="See all ages →" />
        </Link>
      </div>
    </div>
  );
};

// ── makeCategoryCarousels ──────────────────────────────────────────────────
// Factory that creates a carousel component for a given slice of ALL_CATEGORIES.
// Each instance has its own loading state so fetches are independent.

const makeCategoryCarousels = (categories) => {
  const CategoryCarousels = ({ config }) => {
    const [categoryProducts, setCategoryProducts] = useState({});
    // Loading tracked per category so a slow category never delays a faster
    // sibling's carousel from rendering (ProductCarousel takes isLoading per instance).
    const [loadingByCategory, setLoadingByCategory] = useState(() =>
      categories.reduce((acc, { id }) => ({ ...acc, [id]: true }), {})
    );

    const DISPLAY_COUNT = 8;

    useEffect(() => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };

      // Fire each category's fetch independently and update only its own slice
      // of state on completion — see the matching pattern/rationale in OccasionStrip.
      categories.forEach(({ id }) => {
        (async () => {
          try {
            const { pool, allIncluded } = await fetchListingsAcrossBrands(
              sdk,
              DISCOVERY_BRAND_IDS,
              {
                pub_categoryLevel1: id,
                include: ['author', 'images', 'currentStock'],
              },
              PER_BRAND_COUNT
            );

            // Pick diverse brands from the pool
            const listingIds = pickBrandDiverse(pool, DISPLAY_COUNT);
            const entities = updatedEntities({}, { data: pool, included: allIncluded }, sanitizeConfig);
            const refs = listingIds.map(lid => ({ id: lid, type: 'listing' }));
            const listings = denormalisedEntities(entities, refs, false);

            setCategoryProducts(prev => ({ ...prev, [id]: listings }));
          } catch {
            setCategoryProducts(prev => ({ ...prev, [id]: [] }));
          } finally {
            setLoadingByCategory(prev => ({ ...prev, [id]: false }));
          }
        })();
      });
    }, []); // eslint-disable-line

    return (
      <div className={css.categorySections}>
        {categories.map(({ id, label, viewAllSearch }) => (
          <ProductCarousel
            key={id}
            title={label}
            viewAllLinkName="SearchPage"
            viewAllLinkSearch={viewAllSearch}
            listings={categoryProducts[id] || []}
            isLoading={loadingByCategory[id]}
            showInrPrice={false}
          />
        ))}
      </div>
    );
  };
  return CategoryCarousels;
};

// Both surviving categories in a single instance so their skeleton loading states
// render simultaneously.
const AllCategoryCarousels = makeCategoryCarousels(ALL_CATEGORIES);

// ── CategoryShowcase ───────────────────────────────────────────────────────
// P1.3: now just the two surviving category carousels (Fashion, Baby & Kids).
// AgeNavigation moved to the Baby & Kids category page; OccasionStrip moved up to
// its own top-level homepage section (MelaHomePage.js) — both still exported from
// here, just no longer rendered as part of this component.

const CategoryShowcase = () => {
  const config = useConfiguration();

  return (
    <div className={css.showcase}>
      <div className={css.container}>
        {/* Section Header */}
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage
              id="MelaHomePage.categoryTitle"
              defaultMessage="Discover Indian Design"
            />
          </h2>
        </div>

        {/* Fashion + Baby & Kids carousels — single instance so both skeletons render simultaneously */}
        <AllCategoryCarousels config={config} />

        {/* View All Categories CTA */}
        <div className={css.viewAll}>
          <Link to="/categories" className={css.viewAllButton}>
            <FormattedMessage
              id="MelaHomePage.viewAllCategories"
              defaultMessage="Browse All Categories"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryShowcase;
