import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import css from './CustomerFavorites.module.css';

// Mock bestseller data - replace with actual API calls
const BESTSELLERS = [
  {
    id: 1,
    title: 'Organic Cotton Romper Set',
    price: '$24.99',
    originalPrice: '$29.99',
    image: '/static/images/bestseller-1.jpg',
    rating: 4.9,
    reviewCount: 128,
    badge: 'Bestseller',
    category: 'baby-clothing',
    customerPhoto: '/static/images/customer-photo-1.jpg',
    customerName: 'Sarah M.',
    review: 'Perfect for my little one! So soft and well-made.'
  },
  {
    id: 2,
    title: 'Traditional Festival Outfit',
    price: '$39.99',
    originalPrice: null,
    image: '/static/images/bestseller-2.jpg',
    rating: 4.8,
    reviewCount: 89,
    badge: 'Top Rated',
    category: 'toddler-fashion',
    customerPhoto: '/static/images/customer-photo-2.jpg',
    customerName: 'Priya L.',
    review: 'Beautiful design and amazing quality!'
  },
  {
    id: 3,
    title: 'Organic Sleep Set',
    price: '$19.99',
    originalPrice: '$24.99',
    image: '/static/images/bestseller-3.jpg',
    rating: 4.9,
    reviewCount: 156,
    badge: 'GOTS Certified',
    category: 'organic-essentials',
    customerPhoto: '/static/images/customer-photo-3.jpg',
    customerName: 'Emily R.',
    review: 'My baby sleeps so much better in these!'
  },
  {
    id: 4,
    title: 'Baby Accessories Bundle',
    price: '$16.99',
    originalPrice: '$21.99',
    image: '/static/images/bestseller-4.jpg',
    rating: 4.7,
    reviewCount: 94,
    badge: 'Complete Set',
    category: 'accessories',
    customerPhoto: '/static/images/customer-photo-4.jpg',
    customerName: 'Anna K.',
    review: 'Great value and beautiful colors!'
  }
];

const TRUST_STATS = [
  { number: '4.8', label: 'Average Rating', icon: '⭐' },
  { number: '2,500+', label: 'Happy Customers', icon: '👨‍👩‍👧‍👦' },
  { number: '15,000+', label: 'Products Sold', icon: '📦' },
  { number: '99%', label: 'Satisfaction Rate', icon: '💚' }
];

const CustomerFavorites = () => {
  return (
    <div className={css.favorites}>
      <div className={css.container}>
        {/* Section Header */}
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage
              id="MelaHomePage.favoritesTitle"
              defaultMessage="Bestsellers & Customer Picks"
            />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage
              id="MelaHomePage.favoritesSubtitle"
              defaultMessage="Loved by families worldwide - see what our customers can't stop raving about"
            />
          </p>
        </div>

        {/* Trust Statistics */}
        <div className={css.trustStats}>
          {TRUST_STATS.map((stat, index) => (
            <div key={index} className={css.trustStat}>
              <span className={css.statIcon}>{stat.icon}</span>
              <span className={css.statNumber}>{stat.number}</span>
              <span className={css.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Products Grid */}
        <div className={css.productsGrid}>
          {BESTSELLERS.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* View All Bestsellers CTA */}
        <div className={css.viewAll}>
          <NamedLink name="SearchPage" params={{ sort: 'bestselling' }} className={css.viewAllButton}>
            <FormattedMessage
              id="MelaHomePage.viewBestsellers"
              defaultMessage="View All Bestsellers"
            />
          </NamedLink>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, index }) => {
  const discountPercent = product.originalPrice
    ? Math.round(((parseFloat(product.originalPrice.slice(1)) - parseFloat(product.price.slice(1))) / parseFloat(product.originalPrice.slice(1))) * 100)
    : 0;

  return (
    <div className={css.productCard}>
      <NamedLink
        name="SearchPage"
        params={{ pub_category: product.category }}
        className={css.productLink}
      >
        <div className={css.productImage}>
          <img
            src={product.image}
            alt={product.title}
            className={css.image}
            loading={index < 2 ? 'eager' : 'lazy'}
          />

          {/* Product Badge */}
          <div className={css.badge}>
            {product.badge}
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className={css.discountBadge}>
              -{discountPercent}%
            </div>
          )}

          {/* Quick View Overlay */}
          <div className={css.quickView}>
            <FormattedMessage
              id="MelaHomePage.quickView"
              defaultMessage="Quick View"
            />
          </div>
        </div>

        <div className={css.productInfo}>
          {/* Rating */}
          <div className={css.rating}>
            <div className={css.stars}>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`${css.star} ${i < Math.floor(product.rating) ? css.filled : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className={css.ratingText}>
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Product Title */}
          <h3 className={css.productTitle}>{product.title}</h3>

          {/* Price */}
          <div className={css.priceSection}>
            <span className={css.currentPrice}>{product.price}</span>
            {product.originalPrice && (
              <span className={css.originalPrice}>{product.originalPrice}</span>
            )}
          </div>
        </div>
      </NamedLink>

      {/* Customer Review */}
      <div className={css.customerReview}>
        <div className={css.reviewHeader}>
          <img
            src={product.customerPhoto}
            alt={product.customerName}
            className={css.customerPhoto}
          />
          <div className={css.customerInfo}>
            <span className={css.customerName}>{product.customerName}</span>
            <span className={css.verifiedBadge}>
              <FormattedMessage
                id="MelaHomePage.verifiedPurchase"
                defaultMessage="Verified Purchase"
              />
            </span>
          </div>
        </div>
        <p className={css.reviewText}>"{product.review}"</p>
      </div>
    </div>
  );
};

export default CustomerFavorites;