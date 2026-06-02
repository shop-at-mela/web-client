import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { NamedLink, BrandCardHome } from '../../../../components';
import {
  fetchFeaturedBrands,
  getFeaturedBrandsWithProducts,
  getFeaturedBrandsInProgress,
  getFeaturedBrandsError,
} from '../../../BrandsPage/BrandsPage.duck';

import css from './HeroSection.module.css';

const TRUST_BADGES = [
  { icon: '✨', text: 'Hand-Curated Brands' },
  { icon: '🇮🇳', text: 'Independent Indian Brands' },
  { icon: '🇺🇸', text: 'Ships to All 50 States' },
  { icon: '💳', text: 'US Cards Accepted' },
];

const TOP_CATEGORY_PILLS = [
  { id: 'Baby-Kids',           label: 'Baby & Kids',    icon: '👶' },
  { id: 'Fashion',             label: 'Fashion',        icon: '👗' },
  { id: 'Home-Kitchen',        label: 'Home & Kitchen', icon: '🏡' },
  { id: 'Jewelry-Accessories', label: 'Jewelry',        icon: '💎' },
  { id: 'Beauty-Wellness',     label: 'Beauty',         icon: '💄' },
  { id: 'Art-Craft',           label: 'Art & Craft',    icon: '🎨' },
];

const AUTOPLAY_INTERVAL = 8000;
const MANUAL_PAUSE_DURATION = 15000;
const TOUCH_PAUSE_DURATION = 5000;
const SWIPE_THRESHOLD = 50;

const HeroSectionComponent = ({
  brandsWithProducts = [],
  fetchInProgress = false,
  fetchError = null,
  onFetchFeaturedBrands,
}) => {
  const intl = useIntl();
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartXRef = useRef(null);
  const resumeTimerRef = useRef(null);

  // Fetch on mount if not already loaded
  useEffect(() => {
    if (onFetchFeaturedBrands && brandsWithProducts.length === 0 && !fetchInProgress) {
      onFetchFeaturedBrands();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance every 8s
  useEffect(() => {
    if (!isAutoPlaying || brandsWithProducts.length < 2) return;
    const interval = setInterval(() => {
      setCurrentBrandIndex(prev => (prev + 1) % brandsWithProducts.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlaying, brandsWithProducts.length]);

  // Clamp index if brands list shrinks
  useEffect(() => {
    if (brandsWithProducts.length > 0 && currentBrandIndex >= brandsWithProducts.length) {
      setCurrentBrandIndex(0);
    }
  }, [brandsWithProducts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const scheduleResume = duration => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), duration);
  };

  const goToBrand = index => {
    setCurrentBrandIndex(index);
    setIsAutoPlaying(false);
    scheduleResume(MANUAL_PAUSE_DURATION);
  };

  const goToPrev = () =>
    goToBrand((currentBrandIndex - 1 + brandsWithProducts.length) % brandsWithProducts.length);

  const goToNext = () =>
    goToBrand((currentBrandIndex + 1) % brandsWithProducts.length);

  // Touch: pause + swipe
  const handleTouchStart = e => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsAutoPlaying(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleTouchEnd = e => {
    if (touchStartXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      delta < 0 ? goToNext() : goToPrev();
    }
    scheduleResume(TOUCH_PAUSE_DURATION);
  };

  // Desktop: pause on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleMouseLeave = () => {
    scheduleResume(MANUAL_PAUSE_DURATION);
  };

  const categoryPills = (
    <div className={css.categoryPillsWrapper}>
      <span className={css.pillsLabel}>
        <FormattedMessage id="HeroSection.shopByCategory" defaultMessage="Shop by category" />
      </span>
      <div className={css.categoryPills}>
        {TOP_CATEGORY_PILLS.map(({ id, label, icon }) => (
          <Link key={id} to={`/categories/${id}`} className={css.categoryPill}>
            <span className={css.pillIcon}>{icon}</span>
            <span className={css.pillLabel}>{label}</span>
            <span className={css.pillArrow} aria-hidden="true">›</span>
          </Link>
        ))}
      </div>
    </div>
  );

  // Headline + subheadline: renders first on mobile and in left-top on desktop
  const textTop = (
    <div className={css.textTop}>
      <h1 className={css.headline}>
        <FormattedMessage
          id="SectionMelaHero.heroHeadline"
          defaultMessage="Independent Indian Brands, Curated for Your Family"
        />
      </h1>
      <p className={css.subheadline}>
        <FormattedMessage
          id="SectionMelaHero.heroSubheadline"
          defaultMessage="Baby essentials, fashion, home, jewelry, and wellness — hand-selected from the best independent brands in India, shipped directly to you in the US."
        />
      </p>
    </div>
  );

  // Trust badges + primary CTA: renders after the carousel on mobile so social
  // proof (the brand card) comes before the ask. On desktop it sits left-bottom.
  const ctaBlock = (
    <div className={css.ctaBlock}>
      <div className={css.trustBadges}>
        {TRUST_BADGES.map((badge, index) => (
          <div key={index} className={css.trustBadge}>
            <span className={css.badgeIcon}>{badge.icon}</span>
            <span className={css.badgeText}>{badge.text}</span>
          </div>
        ))}
      </div>
      <NamedLink name="BrandsPage" className={css.primaryCta}>
        <FormattedMessage id="SectionMelaHero.shopNow" defaultMessage="Explore Brands" />
      </NamedLink>
    </div>
  );

  // Loading state — show text + skeleton + CTA
  if (fetchInProgress && brandsWithProducts.length === 0) {
    return (
      <div className={css.hero}>
        <div className={css.container}>
          <div className={css.heroContent}>
            {textTop}
            <div className={css.brandCarousel}>
              <div className={css.brandSkeleton} />
            </div>
            {ctaBlock}
          </div>
          {categoryPills}
        </div>
      </div>
    );
  }

  // No brands configured — show hero text + CTA + pills only
  if (brandsWithProducts.length === 0) {
    return (
      <div className={css.hero}>
        <div className={css.container}>
          <div className={css.heroContent}>
            {textTop}
            {ctaBlock}
          </div>
          {categoryPills}
        </div>
      </div>
    );
  }

  const currentBrand = brandsWithProducts[currentBrandIndex];
  const hasMultiple = brandsWithProducts.length > 1;

  return (
    <div className={css.hero}>
      <div className={css.container}>
        <div className={css.heroContent}>
          {/* 1: Headline + subheadline (always first) */}
          {textTop}

          {/* 2: Brand carousel — social proof before the ask on mobile */}
          <div
            className={css.brandCarousel}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {hasMultiple && (
              <button
                className={`${css.navArrow} ${css.navArrowPrev}`}
                onClick={goToPrev}
                aria-label={intl.formatMessage({ id: 'HeroSection.prevBrand', defaultMessage: 'Previous brand' })}
              >
                ‹
              </button>
            )}

            <div className={css.brandSlide}>
              <BrandCardHome
                brand={currentBrand.brand}
                products={currentBrand.products}
                showCertifications={false}
                showCta={false}
                maxProducts={2}
                showPlaceholders={false}
              />
            </div>

            {hasMultiple && (
              <button
                className={`${css.navArrow} ${css.navArrowNext}`}
                onClick={goToNext}
                aria-label={intl.formatMessage({ id: 'HeroSection.nextBrand', defaultMessage: 'Next brand' })}
              >
                ›
              </button>
            )}

            {hasMultiple && (
              <div className={css.productDots}>
                {brandsWithProducts.map((item, index) => (
                  <button
                    key={index}
                    className={`${css.dot} ${index === currentBrandIndex ? css.activeDot : ''}`}
                    onClick={() => goToBrand(index)}
                    aria-label={intl.formatMessage(
                      { id: 'HeroSection.brandDot', defaultMessage: 'View {brandName}' },
                      { brandName: item.brand?.attributes?.profile?.displayName || String(index + 1) }
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3: Trust badges + primary CTA — comes after social proof on mobile */}
          {ctaBlock}
        </div>

        {categoryPills}
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  brandsWithProducts: getFeaturedBrandsWithProducts(state),
  fetchInProgress: getFeaturedBrandsInProgress(state),
  fetchError: getFeaturedBrandsError(state),
});

const mapDispatchToProps = {
  onFetchFeaturedBrands: fetchFeaturedBrands,
};

const HeroSection = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(HeroSectionComponent);

export default HeroSection;
