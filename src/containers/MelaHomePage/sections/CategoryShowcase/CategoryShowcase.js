import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';
import { useConfiguration } from '../../../../context/configurationContext';

import css from './CategoryShowcase.module.css';

// Helper function to recursively search through nested category structure
const findCategoryById = (categories, categoryId) => {
  if (!categories || !Array.isArray(categories)) return null;

  for (const category of categories) {
    if (category.id === categoryId) {
      return category;
    }
    if (category.subcategories && category.subcategories.length > 0) {
      const found = findCategoryById(category.subcategories, categoryId);
      if (found) return found;
    }
  }
  return null;
};

// Get categories for showcase (level 2 subcategories)
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

  // Return up to 4 subcategories for the showcase
  return showcaseCategories.slice(0, 4);
};

// Map Sharetribe category to showcase format
const formatCategoryForDisplay = (category, index) => {
  if (!category) return null;

  // Default showcase properties
  const showcaseData = {
    id: category.id,
    title: category.name,
    description: `Explore our ${category.name.toLowerCase()} collection`,
    image: `/static/images/category-${category.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
    productCount: 'View Collection',
    featured: [], // Will be populated from subcategories
    badge: index === 0 ? 'Most Popular' : index === 1 ? 'New Arrivals' : 'Trending'
  };

  // Get featured items from subcategories (categoryLevel3)
  if (category.subcategories && category.subcategories.length > 0) {
    showcaseData.featured = category.subcategories
      .slice(0, 3)
      .map(sub => sub.name);
  }

  // If no subcategories, provide fallback featured items based on category type
  if (showcaseData.featured.length === 0) {
    if (category.id.includes('Baby-Clothing') || category.name.toLowerCase().includes('clothing')) {
      showcaseData.featured = ['Organic Rompers', 'Sleep Sets', 'Onesies'];
    } else if (category.id.includes('Shoes') || category.name.toLowerCase().includes('shoes')) {
      showcaseData.featured = ['First Walkers', 'Booties', 'Sneakers'];
    } else if (category.id.includes('Accessories') || category.name.toLowerCase().includes('accessories')) {
      showcaseData.featured = ['Gift Sets', 'Bibs', 'Caps'];
    } else {
      // Generic fallback
      showcaseData.featured = ['Premium Quality', 'Organic Materials', 'Safe for Baby'];
    }
  }

  // Set badges based on category type
  if (category.id.includes('Baby-Clothing') || category.name.toLowerCase().includes('clothing')) {
    showcaseData.badge = 'Most Popular';
  } else if (category.id.includes('Shoes') || category.name.toLowerCase().includes('shoes')) {
    showcaseData.badge = 'New Arrivals';
  } else if (category.id.includes('Accessories') || category.name.toLowerCase().includes('accessories')) {
    showcaseData.badge = 'Complete Sets';
  }

  return showcaseData;
};

const CategoryShowcase = () => {
  const config = useConfiguration();

  // Get categories from Sharetribe configuration
  const categoryConfig = config?.categoryConfiguration?.categories || [];
  const showcaseCategories = getShowcaseCategories(categoryConfig);

  // Format categories for display
  const displayCategories = showcaseCategories
    .map((category, index) => formatCategoryForDisplay(category, index))
    .filter(Boolean); // Remove any null results

  // Don't render if no categories available
  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <div className={css.showcase}>
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

        {/* Category Grid */}
        <div className={css.categoryGrid}>
          {displayCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
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

const CategoryCard = ({ category, index }) => {
  return (
    <NamedLink
      name="SearchPage"
      params={{ pub_category: category.id }}
      className={css.categoryCard}
    >
      <div className={css.cardImage}>
        <img
          src={category.image}
          alt={category.title}
          className={css.image}
          loading={index < 2 ? 'eager' : 'lazy'}
        />

        {/* Category Badge */}
        <div className={css.badge}>
          {category.badge}
        </div>

        {/* Product Count Overlay */}
        <div className={css.productCount}>
          {category.productCount}
        </div>
      </div>

      <div className={css.cardContent}>
        <h3 className={css.categoryTitle}>{category.title}</h3>
        <p className={css.categoryDescription}>{category.description}</p>

        {/* Featured Items */}
        <div className={css.featuredItems}>
          {category.featured.map((item, itemIndex) => (
            <span key={itemIndex} className={css.featuredItem}>
              {item}
            </span>
          ))}
        </div>

        {/* Shop CTA */}
        <div className={css.shopButton}>
          <FormattedMessage
            id="MelaHomePage.shopCategory"
            defaultMessage="Shop {category}"
            values={{ category: category.title.split(' ')[0] }}
          />
          <span className={css.arrow}>→</span>
        </div>
      </div>
    </NamedLink>
  );
};

export default CategoryShowcase;