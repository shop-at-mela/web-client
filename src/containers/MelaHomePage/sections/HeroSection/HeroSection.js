import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { NamedLink, Button, ResponsiveImage } from '../../../../components';
import { formatMoney } from '../../../../util/currency';
import { createSlug } from '../../../../util/urlHelpers';
import { useConfiguration } from '../../../../context/configurationContext';
import { fetchHeroProducts } from '../../../../ducks/heroProducts.duck';

import css from './HeroSection.module.css';

const TRUST_BADGES = [
  { icon: '🌱', text: 'GOTS Certified' },
  { icon: '👶', text: 'Baby Safe' },
  { icon: '🇮🇳', text: 'Made in India' }
];

const HeroSectionComponent = ({
  heroProducts = [],
  fetchHeroProductsInProgress = false,
  fetchHeroProductsError = null,
  onFetchHeroProducts,
}) => {
  const intl = useIntl();
  const config = useConfiguration();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fetch hero products on component mount
  useEffect(() => {
    onFetchHeroProducts(config);
  }, [config, onFetchHeroProducts]);

  // Auto-rotate products every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying || heroProducts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentProductIndex(prev => (prev + 1) % heroProducts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroProducts.length]);

  // Handle case where no products loaded yet
  if (heroProducts.length === 0) {
    if (fetchHeroProductsInProgress) {
      return (
        <div className={css.hero}>
          <div className={css.container}>
            <div className={css.loading}>Loading featured products...</div>
          </div>
        </div>
      );
    }
    if (fetchHeroProductsError) {
      return (
        <div className={css.hero}>
          <div className={css.container}>
            <div className={css.error}>Unable to load featured products</div>
          </div>
        </div>
      );
    }
    return null;
  }

  const currentProduct = heroProducts[currentProductIndex];

  // Helper function to format product data for display
  const formatProductForDisplay = (product) => {
    const { title, price, images } = product.attributes;
    const { brand } = product.attributes.publicData || {};
    const primaryImage = images && images.length > 0 ? images[0] : null;
    const formattedPrice = price ? formatMoney(intl, price) : null;
    const slug = createSlug(title);

    return {
      id: product.id.uuid,
      title,
      price: formattedPrice,
      image: primaryImage,
      category: product.attributes.publicData?.categoryLevel1 || 'products',
      badge: brand || 'Handcrafted',
      linkProps: {
        name: 'ListingPage',
        params: { id: product.id.uuid, slug },
      }
    };
  };

  const displayProduct = formatProductForDisplay(currentProduct);

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
                id="SectionMelaHero.heroHeadline"
                defaultMessage="Sustainable Baby Fashion with Indian Design Heritage"
              />
            </h1>

            <p className={css.subheadline}>
              <FormattedMessage
                id="SectionMelaHero.heroSubheadline"
                defaultMessage="Discover premium organic baby clothes from innovative designers in India. GOTS certified quality, traditional craftsmanship, delivered worldwide."
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
                  id="SectionMelaHero.shopNow"
                  defaultMessage="Shop Now"
                />
              </NamedLink>

              <NamedLink
                name="CategoriesPage"
                className={css.secondaryCta}
              >
                <FormattedMessage
                  id="SectionMelaHero.viewCategories"
                  defaultMessage="View Categories"
                />
              </NamedLink>
            </div>
          </div>

          {/* Product Showcase */}
          <div className={css.productShowcase}>
            <div className={css.featuredProduct}>
              <div className={css.productImage}>
                {displayProduct.image ? (
                  <ResponsiveImage
                    rootClassName={css.productImg}
                    alt={displayProduct.title}
                    image={displayProduct.image}
                    variants={['listing-card', 'listing-card-2x']}
                    sizes="(max-width: 767px) 100vw, 50vw"
                  />
                ) : (
                  <div className={css.noImage}>
                    <FormattedMessage id="HeroSection.noImage" defaultMessage="No image available" />
                  </div>
                )}
                <div className={css.productBadge}>
                  {displayProduct.badge}
                </div>
              </div>

              <div className={css.productInfo}>
                <h3 className={css.productTitle}>{displayProduct.title}</h3>
                <p className={css.productPrice}>{displayProduct.price}</p>
                <NamedLink
                  {...displayProduct.linkProps}
                  className={css.productCta}
                >
                  <FormattedMessage
                    id="SectionMelaHero.viewProduct"
                    defaultMessage="View Product"
                  />
                </NamedLink>
              </div>
            </div>

            {/* Product Navigation Dots */}
            <div className={css.productDots}>
              {heroProducts.map((_, index) => (
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

const mapStateToProps = state => {
  const {
    heroProducts,
    fetchHeroProductsInProgress,
    fetchHeroProductsError,
  } = state.heroProducts || {};

  return {
    heroProducts: heroProducts || [],
    fetchHeroProductsInProgress,
    fetchHeroProductsError,
  };
};

const mapDispatchToProps = {
  onFetchHeroProducts: fetchHeroProducts,
};

const HeroSection = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(HeroSectionComponent);

export default HeroSection;