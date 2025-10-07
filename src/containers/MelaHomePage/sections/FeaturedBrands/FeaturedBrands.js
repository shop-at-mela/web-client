import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import css from './FeaturedBrands.module.css';

// Featured brand data based on strategy - simplified partner highlight
const FEATURED_BRANDS = [
  {
    id: 'masilo',
    name: 'Masilo',
    logo: '/static/images/brand-masilo-logo.png',
    featuredProduct: {
      image: '/static/images/masilo-featured.jpg',
      title: 'Organic Cotton Sleep Set',
      price: '$32.99'
    },
    certification: 'GOTS Certified',
    description: 'Premium organic baby clothing from India',
    category: 'organic-essentials'
  },
  {
    id: 'nino-bambino',
    name: 'Nino Bambino',
    logo: '/static/images/brand-nino-logo.png',
    featuredProduct: {
      image: '/static/images/nino-featured.jpg',
      title: 'Premium Baby Romper',
      price: '$28.99'
    },
    certification: 'Baby Safe',
    description: 'Contemporary baby fashion with traditional touch',
    category: 'baby-clothing'
  },
  {
    id: 'little-tailor',
    name: 'The Little Tailor',
    logo: '/static/images/brand-tailor-logo.png',
    featuredProduct: {
      image: '/static/images/tailor-featured.jpg',
      title: 'Traditional Festive Outfit',
      price: '$45.99'
    },
    certification: 'Handcrafted',
    description: 'Traditional ethnic wear for special occasions',
    category: 'toddler-fashion'
  },
  {
    id: 'pluchi-baby',
    name: 'Pluchi Baby',
    logo: '/static/images/brand-pluchi-logo.png',
    featuredProduct: {
      image: '/static/images/pluchi-featured.jpg',
      title: 'Baby Accessories Set',
      price: '$22.99'
    },
    certification: 'Eco-Friendly',
    description: 'Sustainable baby accessories and essentials',
    category: 'accessories'
  },
  {
    id: 'crane-baby',
    name: 'Crane Baby',
    logo: '/static/images/brand-crane-logo.png',
    featuredProduct: {
      image: '/static/images/crane-featured.jpg',
      title: 'Modern Baby Outfit',
      price: '$26.99'
    },
    certification: 'Organic Cotton',
    description: 'Contemporary baby essentials for modern families',
    category: 'baby-clothing'
  }
];

const FeaturedBrands = () => {
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate brands every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentBrandIndex(prev => (prev + 1) % FEATURED_BRANDS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleBrandClick = (index) => {
    setCurrentBrandIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentBrand = FEATURED_BRANDS[currentBrandIndex];

  return (
    <div className={css.brands}>
      <div className={css.container}>
        {/* Section Header */}
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage
              id="MelaHomePage.brandsTitle"
              defaultMessage="Trusted Brand Partners"
            />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage
              id="MelaHomePage.brandsSubtitle"
              defaultMessage="Discover exceptional baby fashion from our carefully selected sustainable brand partners"
            />
          </p>
        </div>

        {/* Main Brand Showcase */}
        <div className={css.mainShowcase}>
          {/* Featured Brand Details */}
          <div className={css.brandDetails}>
            <div className={css.brandHeader}>
              <img
                src={currentBrand.logo}
                alt={`${currentBrand.name} logo`}
                className={css.brandLogo}
              />
              <div className={css.brandInfo}>
                <h3 className={css.brandName}>{currentBrand.name}</h3>
                <p className={css.brandDescription}>{currentBrand.description}</p>
                <div className={css.certification}>
                  <span className={css.certificationBadge}>
                    ✓ {currentBrand.certification}
                  </span>
                </div>
              </div>
            </div>

            <NamedLink
              name="SearchPage"
              params={{ pub_category: currentBrand.category }}
              className={css.shopBrandButton}
            >
              <FormattedMessage
                id="MelaHomePage.shopBrand"
                defaultMessage="Shop {brandName}"
                values={{ brandName: currentBrand.name }}
              />
            </NamedLink>
          </div>

          {/* Featured Product */}
          <div className={css.featuredProduct}>
            <NamedLink
              name="SearchPage"
              params={{ pub_category: currentBrand.category }}
              className={css.productLink}
            >
              <div className={css.productImage}>
                <img
                  src={currentBrand.featuredProduct.image}
                  alt={currentBrand.featuredProduct.title}
                  className={css.productImg}
                />
                <div className={css.brandBadge}>
                  {currentBrand.name}
                </div>
              </div>
              <div className={css.productInfo}>
                <h4 className={css.productTitle}>
                  {currentBrand.featuredProduct.title}
                </h4>
                <p className={css.productPrice}>
                  {currentBrand.featuredProduct.price}
                </p>
              </div>
            </NamedLink>
          </div>
        </div>

        {/* Brand Navigation */}
        <div className={css.brandNavigation}>
          <div className={css.brandTabs}>
            {FEATURED_BRANDS.map((brand, index) => (
              <button
                key={brand.id}
                className={`${css.brandTab} ${index === currentBrandIndex ? css.activeTab : ''}`}
                onClick={() => handleBrandClick(index)}
                aria-label={`View ${brand.name} products`}
              >
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className={css.tabLogo}
                />
                <span className={css.tabName}>{brand.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* All Brands Grid (Mobile) */}
        <div className={css.allBrandsGrid}>
          {FEATURED_BRANDS.map((brand) => (
            <NamedLink
              key={brand.id}
              name="SearchPage"
              params={{ pub_category: brand.category }}
              className={css.brandCard}
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className={css.cardLogo}
              />
              <span className={css.cardName}>{brand.name}</span>
              <span className={css.cardCertification}>
                {brand.certification}
              </span>
            </NamedLink>
          ))}
        </div>

        {/* Partner CTA */}
        <div className={css.partnerCta}>
          <div className={css.partnerContent}>
            <h3 className={css.partnerTitle}>
              <FormattedMessage
                id="MelaHomePage.partnerTitle"
                defaultMessage="Join Our Brand Network"
              />
            </h3>
            <p className={css.partnerDescription}>
              <FormattedMessage
                id="MelaHomePage.partnerDescription"
                defaultMessage="Bring your sustainable baby fashion to global families"
              />
            </p>
            <NamedLink
              name="SearchPage"
              className={css.partnerButton}
            >
              <FormattedMessage
                id="MelaHomePage.becomePartner"
                defaultMessage="Become a Partner"
              />
            </NamedLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBrands;