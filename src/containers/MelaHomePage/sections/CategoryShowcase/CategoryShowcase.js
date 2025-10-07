import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import css from './CategoryShowcase.module.css';

// Category data based on strategy - 4 main categories
const CATEGORIES = [
  {
    id: 'baby-clothing',
    title: 'Baby Clothing (0-24m)',
    description: 'Rompers, bodysuits, sleepwear',
    image: '/static/images/category-baby-clothing.jpg',
    productCount: '150+ Products',
    featured: ['Organic Rompers', 'Sleep Sets', 'Onesies'],
    badge: 'Most Popular'
  },
  {
    id: 'toddler-fashion',
    title: 'Toddler Fashion (2-5y)',
    description: 'Everyday wear, festive outfits',
    image: '/static/images/category-toddler-fashion.jpg',
    productCount: '120+ Products',
    featured: ['Festive Wear', 'Play Clothes', 'Party Outfits'],
    badge: 'New Arrivals'
  },
  {
    id: 'organic-essentials',
    title: 'Organic Essentials',
    description: 'GOTS certified, premium organic',
    image: '/static/images/category-organic-essentials.jpg',
    productCount: '80+ Products',
    featured: ['GOTS Certified', 'Hypoallergenic', 'Chemical-Free'],
    badge: 'GOTS Certified'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    description: 'Bibs, caps, mittens, booties',
    image: '/static/images/category-accessories.jpg',
    productCount: '200+ Products',
    featured: ['Gift Sets', 'Swaddles', 'Toys'],
    badge: 'Complete Sets'
  }
];

const CategoryShowcase = () => {
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
          {CATEGORIES.map((category, index) => (
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