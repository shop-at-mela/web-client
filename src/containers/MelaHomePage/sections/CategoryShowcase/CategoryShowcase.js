import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink, ListingCard } from '../../../../components';
import { useConfiguration } from '../../../../context/configurationContext';
import { createInstance } from '../../../../util/sdkLoader';
import { denormalisedEntities, updatedEntities } from '../../../../util/data';
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

/**
 * Get categories for showcase (level 2 subcategories)
 * Returns up to 3 categories to showcase on the homepage
 */
const getShowcaseCategories = (categoryConfig) => {
  if (!categoryConfig || !Array.isArray(categoryConfig)) return [];

  // Since there's only 1 top-level category ('Baby Clothes & Accessories'),
  // we need to go one level deeper to get the subcategories (level 2)
  const showcaseCategories = [];

  categoryConfig.forEach(topCategory => {
    if (topCategory.subcategories && topCategory.subcategories.length > 0) {
      // Add subcategories (level 2) to showcase
      showcaseCategories.push(...topCategory.subcategories);
    }
  });

  // Return up to 3 subcategories for the showcase (Baby Clothing, Shoes, Accessories)
  return showcaseCategories.slice(0, 3);
};

/**
 * Generate Schema.org structured data for category showcase
 * Helps search engines understand the page structure and display rich results
 */
const generateStructuredData = (categories, categoryProducts) => {
  const itemListElements = categories.flatMap((category, categoryIndex) => {
    const products = categoryProducts[category.id] || [];
    return products.map((product, productIndex) => ({
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
          availability: 'https://schema.org/InStock',
        },
      },
    }));
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: itemListElements,
  };
};

const CategoryShowcase = () => {
  const config = useConfiguration();
  const [categoryProducts, setCategoryProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Get categories from Sharetribe configuration
  const categoryConfig = config?.categoryConfiguration?.categories || [];
  const showcaseCategories = getShowcaseCategories(categoryConfig);

  // Fetch products for each category
  useEffect(() => {
    if (showcaseCategories.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchCategoryProducts = async () => {
      try {
        // Fetch products for each category
        const productPromises = showcaseCategories.map(async (category) => {
          try {
            const response = await sdk.listings.query({
              pub_categoryLevel2: category.id,
              perPage: 4,
              include: ['images', 'author'],
            });

            // Get listing IDs from response
            const listingIds = response.data.data.map(listing => listing.id);

            return {
              categoryId: category.id,
              listingIds,
              responseData: response.data,
            };
          } catch (error) {
            console.error(`Failed to fetch products for category ${category.id}:`, error);
            return {
              categoryId: category.id,
              listingIds: [],
              responseData: null,
            };
          }
        });

        const results = await Promise.all(productPromises);

        // Now build up entities from all responses
        const listingFields = config?.listing?.listingFields;
        const sanitizeConfig = { listingFields };
        let allEntities = {};

        results.forEach(result => {
          if (result.responseData) {
            allEntities = updatedEntities(allEntities, result.responseData, sanitizeConfig);
          }
        });

        // Denormalize listings for each category
        const productsMap = results.reduce((acc, result) => {
          const { categoryId, listingIds } = result;

          // Convert IDs to entity references
          const entityRefs = listingIds.map(id => ({ id, type: 'listing' }));

          // Denormalize the entities
          const denormalizedListings = denormalisedEntities(allEntities, entityRefs, false);

          acc[categoryId] = denormalizedListings;
          return acc;
        }, {});
        setCategoryProducts(productsMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch category products:', error);
        setIsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [showcaseCategories.length]);

  // Don't render if no categories available
  if (showcaseCategories.length === 0) {
    return null;
  }

  // Generate structured data for SEO
  const structuredData = !isLoading ? generateStructuredData(showcaseCategories, categoryProducts) : null;

  return (
    <div className={css.showcase}>
      {/* Schema.org structured data for rich search results */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <div className={css.container}>
        {/* Section Header */}
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage
              id="MelaHomePage.categoryTitle"
              defaultMessage="Shop by Category"
            />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage
              id="MelaHomePage.categorySubtitle"
              defaultMessage="Discover our carefully curated collection of sustainable baby fashion"
            />
          </p>
        </div>

        {/* Age-Based Navigation - SEO Critical */}
        <AgeNavigation />

        {/* Category Sections with Products */}
        <div className={css.categorySections}>
          {showcaseCategories.map((category, index) => {
            const products = categoryProducts[category.id] || [];
            return (
              <CategorySection
                key={category.id}
                category={category}
                products={products}
                isLoading={isLoading}
                index={index}
              />
            );
          })}
        </div>

        {/* View All Categories CTA */}
        <div className={css.viewAll}>
          <NamedLink name="SearchPage" className={css.viewAllButton}>
            <FormattedMessage
              id="MelaHomePage.viewAllCategories"
              defaultMessage="View All Categories"
            />
          </NamedLink>
        </div>
      </div>
    </div>
  );
};

/**
 * AgeNavigation - Age-based primary navigation (SEO Critical)
 * Parents search by age first (85% of searches), then browse categories
 * Provides direct links to age-filtered search pages with SEO-friendly URLs
 */
const AgeNavigation = () => {
  const ageGroups = [
    { option: 'newborn', label: 'Newborn', icon: '👶' },
    { option: '0_6_months', label: '0-6 Months', icon: '🍼' },
    { option: '6_12_months', label: '6-12 Months', icon: '🧸' },
    { option: '12_18_months', label: '12-18 Months', icon: '👣' },
    { option: '18_24_months', label: '18-24 Months', icon: '🎈' },
  ];

  return (
    <div className={css.ageNavigation}>
      <h3 className={css.ageNavigationTitle}>
        <FormattedMessage
          id="MelaHomePage.shopByAge"
          defaultMessage="Shop by Baby's Age"
        />
      </h3>
      <div className={css.ageFilters}>
        {ageGroups.map(age => (
          <NamedLink
            key={age.option}
            name="SearchPage"
            to={{
              search: `?pub_categoryLevel1=Baby-Clothes-Accessories&pub_age_group=${age.option}`,
            }}
            className={css.ageFilterButton}
          >
            <span className={css.ageIcon}>{age.icon}</span>
            <span className={css.ageLabel}>{age.label}</span>
          </NamedLink>
        ))}
      </div>
    </div>
  );
};

/**
 * CategorySection - Product-first category display
 * Shows category header followed by a grid of real product listings
 */
const CategorySection = ({ category, products, isLoading, index }) => {
  const hasProducts = products && products.length > 0;

  return (
    <div className={css.categorySection}>
      {/* Category Header */}
      <div className={css.categorySectionHeader}>
        <div className={css.categoryHeaderContent}>
          <h3 className={css.sectionCategoryTitle}>{category.name}</h3>
          <p className={css.sectionCategoryDescription}>
            {category.subcategories && category.subcategories.length > 0
              ? category.subcategories.slice(0, 3).map(sub => sub.name).join(' • ')
              : `Explore our ${category.name.toLowerCase()} collection`}
          </p>
        </div>
        <NamedLink
          name="SearchPage"
          to={{
            search: `?pub_categoryLevel1=Baby-Clothes-Accessories&pub_categoryLevel2=${category.id}`,
          }}
          className={css.viewCategoryLink}
        >
          <FormattedMessage
            id="MelaHomePage.viewAll"
            defaultMessage="View All"
          />
          <span className={css.arrow}>→</span>
        </NamedLink>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className={css.productGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={css.productSkeleton} />
          ))}
        </div>
      ) : hasProducts ? (
        <div className={css.productGrid}>
          {products.map((listing, productIndex) => (
            <ListingCard
              key={listing.id.uuid}
              listing={listing}
              showAuthorInfo={false}
              showTrustBadges={true}
              showConversionBadges={true}
              isBestseller={productIndex === 0} // First product is bestseller
              renderSizes="(max-width: 639px) 50vw, (max-width: 1023px) 50vw, 25vw"
            />
          ))}
        </div>
      ) : (
        <div className={css.noProducts}>
          <p>
            <FormattedMessage
              id="MelaHomePage.noProducts"
              defaultMessage="No products available in this category yet."
            />
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryShowcase;