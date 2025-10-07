import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink, Button } from '../../../../components';

import css from './HeroSection.module.css';

// Mock product data - replace with actual product API calls
const HERO_PRODUCTS = [
  {
    id: 1,
    title: 'Organic Cotton Romper',
    price: '$24.99',
    image: '/static/images/hero-product-1.jpg',
    category: 'baby-clothing',
    badge: 'GOTS Certified'
  },
  {
    id: 2,
    title: 'Traditional Festive Outfit',
    price: '$39.99',
    image: '/static/images/hero-product-2.jpg',
    category: 'toddler-fashion',
    badge: 'Organic Cotton'
  },
  {
    id: 3,
    title: 'Baby Essentials Set',
    price: '$19.99',
    image: '/static/images/hero-product-3.jpg',
    category: 'accessories',
    badge: 'Baby Safe'
  }
];

const TRUST_BADGES = [
  { icon: '🌱', text: 'GOTS Certified' },
  { icon: '👶', text: 'Baby Safe' },
  { icon: '⭐', text: '4.8/5 Rating' },
  { icon: '🚚', text: 'Free Shipping' }
];

const HeroSection = () => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate products every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentProductIndex(prev => (prev + 1) % HERO_PRODUCTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentProduct = HERO_PRODUCTS[currentProductIndex];

  const handleProductClick = (index) => {
    setCurrentProductIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className={css.hero}>
      <div className={css.container}>
        {/* Main Hero Content */}
        <div className={css.heroContent}>
          {/* Text Content */}
          <div className={css.textContent}>
            <h1 className={css.headline}>
              <FormattedMessage
                id="MelaHomePage.heroHeadline"
                defaultMessage="Sustainable Baby Fashion with Global Design Diversity"
              />
            </h1>

            <p className={css.subheadline}>
              <FormattedMessage
                id="MelaHomePage.heroSubheadline"
                defaultMessage="Discover organic, ethically-made baby clothes from innovative designers worldwide. GOTS certified, premium quality, and sustainably crafted for your little one."
              />
            </p>

            {/* Trust Badges */}
            <div className={css.trustBadges}>
              {TRUST_BADGES.map((badge, index) => (
                <div key={index} className={css.trustBadge}>
                  <span className={css.badgeIcon}>{badge.icon}</span>
                  <span className={css.badgeText}>{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <div className={css.ctaButtons}>
              <NamedLink
                name="SearchPage"
                className={css.primaryCta}
              >
                <FormattedMessage
                  id="MelaHomePage.shopNow"
                  defaultMessage="Shop Now"
                />
              </NamedLink>

              <NamedLink
                name="SearchPage"
                params={{ pub_category: 'baby-clothing' }}
                className={css.secondaryCta}
              >
                <FormattedMessage
                  id="MelaHomePage.viewCategories"
                  defaultMessage="View Categories"
                />
              </NamedLink>
            </div>
          </div>

          {/* Product Showcase */}
          <div className={css.productShowcase}>
            <div className={css.featuredProduct}>
              <div className={css.productImage}>
                <img
                  src={currentProduct.image}
                  alt={currentProduct.title}
                  className={css.productImg}
                />
                <div className={css.productBadge}>
                  {currentProduct.badge}
                </div>
              </div>

              <div className={css.productInfo}>
                <h3 className={css.productTitle}>{currentProduct.title}</h3>
                <p className={css.productPrice}>{currentProduct.price}</p>
                <NamedLink
                  name="SearchPage"
                  params={{ pub_category: currentProduct.category }}
                  className={css.productCta}
                >
                  <FormattedMessage
                    id="MelaHomePage.viewProduct"
                    defaultMessage="View Product"
                  />
                </NamedLink>
              </div>
            </div>

            {/* Product Navigation Dots */}
            <div className={css.productDots}>
              {HERO_PRODUCTS.map((_, index) => (
                <button
                  key={index}
                  className={`${css.dot} ${index === currentProductIndex ? css.activeDot : ''}`}
                  onClick={() => handleProductClick(index)}
                  aria-label={`View product ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Category Navigation */}
        <div className={css.quickNav}>
          <NamedLink
            name="SearchPage"
            params={{ pub_category: 'baby-clothing' }}
            className={css.quickNavItem}
          >
            <span className={css.quickNavIcon}>👶</span>
            <span className={css.quickNavText}>Baby (0-24m)</span>
          </NamedLink>

          <NamedLink
            name="SearchPage"
            params={{ pub_category: 'toddler-fashion' }}
            className={css.quickNavItem}
          >
            <span className={css.quickNavIcon}>🧸</span>
            <span className={css.quickNavText}>Toddler (2-5y)</span>
          </NamedLink>

          <NamedLink
            name="SearchPage"
            params={{ pub_category: 'organic-essentials' }}
            className={css.quickNavItem}
          >
            <span className={css.quickNavIcon}>🌱</span>
            <span className={css.quickNavText}>Organic</span>
          </NamedLink>

          <NamedLink
            name="SearchPage"
            params={{ pub_category: 'accessories' }}
            className={css.quickNavItem}
          >
            <span className={css.quickNavIcon}>🎀</span>
            <span className={css.quickNavText}>Accessories</span>
          </NamedLink>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;