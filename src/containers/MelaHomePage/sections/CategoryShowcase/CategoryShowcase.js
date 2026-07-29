import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink, ListingCard, ProductCarousel } from '../../../../components';
import { useConfiguration } from '../../../../context/configurationContext';
import { denormalisedEntities, updatedEntities, pickBrandDiverse } from '../../../../util/data';
import { fetchListingsAcrossBrands } from '../../../../util/bestsellerCarousel';
import { allBrandIds, getBrandSlugById } from '../../../../config/configBrands';
import sdk from '../../../../util/homepageSdk';

import css from './CategoryShowcase.module.css';

// ── Occasion config ────────────────────────────────────────────────────────
// Only two validated occasions for Mela's US diaspora audience.
// 'everyday' and 'new-baby' removed — covered by age-group filters.

// Exported so other surfaces (e.g. BrandOccasionModule on the brand storefront)
// reuse the same occasion copy/config instead of redefining it.
export const OCCASIONS = [
  {
    option: 'diwali-festivals',
    label: 'Diwali & Festivals',
    description: 'Indian festive wear, artisan toys, and gifts for every celebration',
    cta: 'Shop Festive Wear',
    ctaSeasonal: 'Shop for Diwali',
    colorTheme: 'festive',
  },
  {
    option: 'gifting',
    label: 'Gifting',
    description: 'Curated gifts for baby showers, naming ceremonies, and first milestones',
    cta: 'Shop Gifts',
    ctaSeasonal: null,
    colorTheme: 'gifting',
  },
];

// Diwali season: Oct 1 – Nov 15
export const isDiwaliSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return month === 10 || (month === 11 && day <= 15);
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
// Two-panel editorial section: one panel per occasion.
// Accepts optional additionalQueryParams to scope results to a category
// (used on CategoryPage to show occasion products within the current category).
// Seasonal ordering: Diwali & Festivals first Oct 1–Nov 15, Gifting first otherwise.

export const OccasionStrip = ({ config, additionalQueryParams = {} }) => {
  const [occasionProducts, setOccasionProducts] = useState({});
  // Loading is tracked per occasion (not one shared flag) so a slow occasion's
  // fetch never delays a faster sibling's panel from rendering — see the
  // per-occasion effect below.
  const [loadingByOccasion, setLoadingByOccasion] = useState(() =>
    OCCASIONS.reduce((acc, { option }) => ({ ...acc, [option]: true }), {})
  );

  const inSeason = isDiwaliSeason();
  // Show Diwali first during season, Gifting first off-season
  const orderedOccasions = inSeason ? OCCASIONS : [...OCCASIONS].reverse();

  const additionalParamsKey = JSON.stringify(additionalQueryParams);
  const DISPLAY_COUNT = 6;

  useEffect(() => {
    const listingFields = config?.listing?.listingFields;
    const sanitizeConfig = { listingFields };

    setLoadingByOccasion(OCCASIONS.reduce((acc, { option }) => ({ ...acc, [option]: true }), {}));

    // Fire each occasion's fetch independently (not inside a shared Promise.all)
    // and update only that occasion's slice of state on completion, so whichever
    // occasion responds first renders first instead of both waiting on the
    // slower of the two. fetchListingsAcrossBrands additionally bounds each
    // per-brand request within a single occasion's fetch (see PER_BRAND_TIMEOUT_MS
    // in util/bestsellerCarousel.js).
    OCCASIONS.forEach(({ option }) => {
      (async () => {
        try {
          // Query-time diversity: fetch a couple of listings from every configured
          // brand rather than one marketplace-wide query, so one brand's inventory
          // can't monopolize the pool before diversification even gets a chance.
          const { pool, allIncluded } = await fetchListingsAcrossBrands(
            sdk,
            DISCOVERY_BRAND_IDS,
            {
              pub_occasion: option,
              include: ['author', 'images', 'currentStock'],
              ...additionalQueryParams,
            },
            PER_BRAND_COUNT
          );

          // Client-side guard: only keep raw listings that actually carry this
          // occasion value in publicData. Protects against the pub_occasion search
          // index not being set up in Sharetribe Console (filter silently ignored →
          // all listings returned). Must run BEFORE pickBrandDiverse — diversifying
          // first and filtering after would diversify across the whole unfiltered
          // pool, then collapse back down to whichever single brand happens to have
          // the most occasion-tagged listings once the irrelevant picks are dropped.
          const occasionTagged = pool.filter(listing => {
            const occasions = listing.attributes?.publicData?.occasion;
            // Handle both storage formats:
            // - array ['gifting'] when ingested with schema-aware parsing
            // - string 'gifting' when ingested before schema config was loaded
            return Array.isArray(occasions)
              ? occasions.includes(option)
              : occasions === option;
          });
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
          const filtered = all.filter(listing => {
            const occasions = listing.attributes?.publicData?.occasion;
            return Array.isArray(occasions)
              ? occasions.includes(option)
              : occasions === option;
          });

          setOccasionProducts(prev => ({ ...prev, [option]: filtered }));
        } catch {
          setOccasionProducts(prev => ({ ...prev, [option]: [] }));
        } finally {
          setLoadingByOccasion(prev => ({ ...prev, [option]: false }));
        }
      })();
    });
  }, [additionalParamsKey]); // eslint-disable-line

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

  return (
    <div className={css.occasionStrip}>
      <h3 className={css.ageNavigationTitle}>
        <FormattedMessage id="MelaHomePage.shopByOccasion" defaultMessage="Shop by Occasion" />
      </h3>

      <div className={css.occasionPanels}>
        {visibleOccasions.map(occasion => {
          const stillLoading = loadingByOccasion[occasion.option];
          const products = occasionProducts[occasion.option] || [];

          const ctaLabel = inSeason && occasion.ctaSeasonal ? occasion.ctaSeasonal : occasion.cta;

          // SearchPage URL needs the has_any: prefix for multi-enum fields;
          // the direct SDK query above uses the bare value instead
          const queryParts = { pub_occasion: `has_any:${occasion.option}`, ...additionalQueryParams };
          const viewAllSearch = '?' + new URLSearchParams(queryParts).toString();

          const panelColorClass =
            occasion.colorTheme === 'festive' ? css.occasionPanelFestive : css.occasionPanelGifting;
          const ctaColorClass =
            occasion.colorTheme === 'festive' ? css.occasionCtaFestive : css.occasionCtaGifting;

          return (
            <div key={occasion.option} className={`${css.occasionPanel} ${panelColorClass}`}>
              {/* Panel header: title only */}
              <div className={css.occasionPanelHeader}>
                <h4 className={css.occasionPanelTitle}>{occasion.label}</h4>
              </div>

              {/* Product carousel — same HTML/CSS pattern as AgeNavigation */}
              {stillLoading ? (
                <div className={css.productCarousel}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`${css.productSkeleton} ${css.carouselCard}`} />
                  ))}
                </div>
              ) : (
                <div className={css.productCarousel}>
                  {products.map((listing) => (
                    <div key={listing.id.uuid} className={css.carouselCard}>
                      <ListingCard
                        listing={listing}
                        showAuthorInfo={false}
                        showTrustBadges={true}
                        showConversionBadges={true}
                        isBestseller={listing.attributes?.publicData?.isBestseller || false}
                        renderSizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* CTA button */}
              <div className={css.occasionCtaRow}>
                <NamedLink
                  name="SearchPage"
                  to={{ search: viewAllSearch }}
                  className={`${css.occasionCta} ${ctaColorClass}`}
                >
                  {ctaLabel} <span className={css.arrow}>→</span>
                </NamedLink>
              </div>
            </div>
          );
        })}
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
