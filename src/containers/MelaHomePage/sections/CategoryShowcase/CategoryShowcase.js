import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink, ListingCard, ProductCarousel } from '../../../../components';
import { useConfiguration } from '../../../../context/configurationContext';
import { createInstance } from '../../../../util/sdkLoader';
import { denormalisedEntities, updatedEntities, pickBrandDiverse } from '../../../../util/data';
import { fetchBestsellerCarousel } from '../../../../util/bestsellerCarousel';
import appSettings from '../../../../config/settings';
import * as apiUtils from '../../../../util/api';

import css from './CategoryShowcase.module.css';

// Create SDK instance for fetching listings (matches pattern from index.js)
const baseUrl = appSettings.sdk.baseUrl ? { baseUrl: appSettings.sdk.baseUrl } : {};
const assetCdnBaseUrl = appSettings.sdk.assetCdnBaseUrl
  ? { assetCdnBaseUrl: appSettings.sdk.assetCdnBaseUrl }
  : {};

const sdk = createInstance({
  transitVerbose: appSettings.sdk.transitVerbose,
  clientId: appSettings.sdk.clientId,
  secure: appSettings.usingSSL,
  typeHandlers: apiUtils.typeHandlers,
  ...baseUrl,
  ...assetCdnBaseUrl,
});

// ── Occasion config ────────────────────────────────────────────────────────
// Only two validated occasions for Mela's US diaspora audience.
// 'everyday' and 'new-baby' removed — covered by age-group filters.

const OCCASIONS = [
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
const isDiwaliSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return month === 10 || (month === 11 && day <= 15);
};

const TOP_AGE_GROUPS = [
  { option: 'newborn',     label: 'Newborn' },
  { option: '0_6_months',  label: '0-6 Months' },
  { option: '6_12_months', label: '6-12 Months' },
];

const ALL_CATEGORIES = [
  { id: 'Baby-Kids',           label: 'Baby & Kids',          viewAllSearch: '?pub_categoryLevel1=Baby-Kids' },
  { id: 'Fashion',             label: 'Indian Fashion',        viewAllSearch: '?pub_categoryLevel1=Fashion' },
  { id: 'Home-Kitchen',        label: 'Home & Kitchen',        viewAllSearch: '?pub_categoryLevel1=Home-Kitchen' },
  { id: 'Jewelry-Accessories', label: 'Jewelry & Accessories', viewAllSearch: '?pub_categoryLevel1=Jewelry-Accessories' },
  { id: 'Beauty-Wellness',     label: 'Beauty & Wellness',     viewAllSearch: '?pub_categoryLevel1=Beauty-Wellness' },
  { id: 'Art-Craft',           label: 'Art & Craft',           viewAllSearch: '?pub_categoryLevel1=Art-Craft' },
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
  const [isLoading, setIsLoading] = useState(true);

  const inSeason = isDiwaliSeason();
  // Show Diwali first during season, Gifting first off-season
  const orderedOccasions = inSeason ? OCCASIONS : [...OCCASIONS].reverse();

  const additionalParamsKey = JSON.stringify(additionalQueryParams);
  const DISPLAY_COUNT = 6;

  useEffect(() => {
    const listingFields = config?.listing?.listingFields;
    const sanitizeConfig = { listingFields };

    const fetchOccasionProducts = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          OCCASIONS.map(async ({ option }) => {
            try {
              const { pool, allIncluded } = await fetchBestsellerCarousel(
                sdk,
                {
                  pub_occasion: option,
                  include: ['images', 'currentStock'],
                  ...additionalQueryParams,
                },
                DISPLAY_COUNT
              );

              // Pick diverse brands from the pool
              const listingIds = pickBrandDiverse(pool, DISPLAY_COUNT);
              return { option, listingIds, responseData: { data: pool, included: allIncluded } };
            } catch {
              return { option, listingIds: [], responseData: null };
            }
          })
        );

        let allEntities = {};
        results.forEach(r => {
          if (r.responseData) {
            allEntities = updatedEntities(allEntities, r.responseData, sanitizeConfig);
          }
        });

        const productsMap = results.reduce((acc, { option, listingIds }) => {
          const refs = listingIds.map(id => ({ id, type: 'listing' }));
          const all = denormalisedEntities(allEntities, refs, false);
          // Client-side guard: only keep listings that actually carry this occasion
          // value in publicData. Protects against the pub_occasion search index not
          // being set up in Sharetribe Console (filter silently ignored → all
          // listings returned). Panel auto-hides when fewer than 2 pass this check.
          const filtered = all.filter(listing => {
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
              `[OccasionStrip] ${option}: ${all.length} from API → ${filtered.length} with occasion tag`
            );
          }
          acc[option] = filtered;
          return acc;
        }, {});

        setOccasionProducts(productsMap);
      } catch {
        // Leave empty — panels with < 2 products won't render
      } finally {
        setIsLoading(false);
      }
    };

    fetchOccasionProducts();
  }, [additionalParamsKey]); // eslint-disable-line

  // Determine which panels have enough products to show
  const visibleOccasions = orderedOccasions.filter(
    o => isLoading || (occasionProducts[o.option] || []).length >= 2
  );

  // Hide the entire strip if no occasion has enough products
  if (!isLoading && visibleOccasions.length === 0) return null;

  const occasionsToRender = isLoading ? orderedOccasions : visibleOccasions;

  return (
    <div className={css.occasionStrip}>
      <h3 className={css.ageNavigationTitle}>
        <FormattedMessage id="MelaHomePage.shopByOccasion" defaultMessage="Shop by Occasion" />
      </h3>

      <div className={css.occasionPanels}>
        {occasionsToRender.map(occasion => {
          const products = occasionProducts[occasion.option] || [];
          const hasEnough = products.length >= 2;

          if (!isLoading && !hasEnough) return null;

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
              {isLoading ? (
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

const AgeNavigation = ({ config }) => {
  const [ageProducts, setAgeProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const DISPLAY_COUNT = 8;

  useEffect(() => {
    const listingFields = config?.listing?.listingFields;
    const sanitizeConfig = { listingFields };

    const fetchAgeProducts = async () => {
      try {
        const results = await Promise.all(
          TOP_AGE_GROUPS.map(async ({ option }) => {
            try {
              const { pool, allIncluded } = await fetchBestsellerCarousel(
                sdk,
                {
                  pub_age_group: option,
                  include: ['images', 'currentStock'],
                },
                DISPLAY_COUNT
              );

              // Pick diverse brands from the pool
              const listingIds = pickBrandDiverse(pool, DISPLAY_COUNT);
              return { option, listingIds, responseData: { data: pool, included: allIncluded } };
            } catch {
              return { option, listingIds: [], responseData: null };
            }
          })
        );

        let allEntities = {};
        results.forEach(r => {
          if (r.responseData) {
            allEntities = updatedEntities(allEntities, r.responseData, sanitizeConfig);
          }
        });

        const productsMap = results.reduce((acc, { option, listingIds }) => {
          const refs = listingIds.map(id => ({ id, type: 'listing' }));
          acc[option] = denormalisedEntities(allEntities, refs, false);
          return acc;
        }, {});

        setAgeProducts(productsMap);
      } catch {
        // leave empty
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgeProducts();
  }, []);

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
            isLoading={isLoading}
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
    const [isLoading, setIsLoading] = useState(true);

    const DISPLAY_COUNT = 8;

    useEffect(() => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };

      const fetchProducts = async () => {
        try {
          const results = await Promise.all(
            categories.map(async ({ id }) => {
              try {
                const { pool, allIncluded } = await fetchBestsellerCarousel(
                  sdk,
                  {
                    pub_categoryLevel1: id,
                    include: ['images', 'currentStock'],
                  },
                  DISPLAY_COUNT
                );

                // Pick diverse brands from the pool
                const listingIds = pickBrandDiverse(pool, DISPLAY_COUNT);
                return { id, listingIds, responseData: { data: pool, included: allIncluded } };
              } catch {
                return { id, listingIds: [], responseData: null };
              }
            })
          );

          let allEntities = {};
          results.forEach(r => {
            if (r.responseData) {
              allEntities = updatedEntities(allEntities, r.responseData, sanitizeConfig);
            }
          });

          const productsMap = results.reduce((acc, { id, listingIds }) => {
            const refs = listingIds.map(lid => ({ id: lid, type: 'listing' }));
            acc[id] = denormalisedEntities(allEntities, refs, false);
            return acc;
          }, {});

          setCategoryProducts(productsMap);
        } catch {
          // leave empty
        } finally {
          setIsLoading(false);
        }
      };

      fetchProducts();
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
            isLoading={isLoading}
          />
        ))}
      </div>
    );
  };
  return CategoryCarousels;
};

// All 6 categories in a single instance so their skeleton loading states render
// simultaneously — prevents the "Baby & Kids only" perception during initial load.
const AllCategoryCarousels = makeCategoryCarousels(ALL_CATEGORIES);

// ── CategoryShowcase ───────────────────────────────────────────────────────

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

        {/* All 6 category carousels — single instance so all skeletons render simultaneously */}
        <AllCategoryCarousels config={config} />

        {/* Age-Based Navigation — directly after category carousels */}
        <AgeNavigation config={config} />

        {/* Occasion Strip */}
        <OccasionStrip config={config} />

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
