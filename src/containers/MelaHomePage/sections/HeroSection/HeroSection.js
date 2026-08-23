import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';
// Direct imports (not via the components barrel) to avoid the barrel's
// circular-dependency chain that resolves sdkLoader/sdkTypes — adding a new
// export to index.js reorders evaluation and can break `sdkTypes.UUID`.
import CategoryIcon from '../../../../components/CategoryIcon/CategoryIcon';
import BrandHeroCard from '../../../../components/BrandHeroCard/BrandHeroCard';
import {
  fetchHeroBrands,
  getHeroBrands,
  getHeroBrandsInProgress,
  getHeroBrandsError,
} from '../../../BrandsPage/BrandsPage.duck';
import { getAllBrandIds, getPopulatedCategoryCount } from '../../../../config/configBrands';

import css from './HeroSection.module.css';

const TRUST_BADGES = [
  { icon: '🌍', text: 'Ships Worldwide' },
  { icon: '💳', text: 'Secure Checkout' },
];

// Category ids map 1:1 to CategoryIcon glyphs (custom India-resonant line icons).
const TOP_CATEGORY_PILLS = [
  { id: 'Baby-Kids',           label: 'Baby & Kids' },
  { id: 'Fashion',             label: 'Fashion' },
  { id: 'Home-Kitchen',        label: 'Home & Kitchen' },
  { id: 'Jewelry-Accessories', label: 'Jewelry' },
  { id: 'Beauty-Wellness',     label: 'Beauty' },
  { id: 'Art-Craft',           label: 'Art & Craft' },
];

const AUTOPLAY_INTERVAL = 8000;
const MANUAL_PAUSE_DURATION = 15000;
const TOUCH_PAUSE_DURATION = 5000;
// Debounce for deriving the active slide from the track's scroll position
const SCROLL_SETTLE_MS = 120;

// Breadth signal (T1-7): show the numeric count only once supply is credible;
// below the threshold, render the qualitative label so a small number never
// reads as "pop-up". Reads the live env brand config (QA = pseudo-production).
const BREADTH_MIN_BRANDS = 25;
const BREADTH_MIN_CATEGORIES = 4;

const HeroSectionComponent = ({
  heroBrands = [],
  fetchInProgress = false,
  fetchError = null,
  onFetchHeroBrands,
}) => {
  const intl = useIntl();
  // Respect prefers-reduced-motion: start with autoplay OFF for those users
  // (WCAG 2.2.2). SSR-safe guard — window is absent during server render.
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(!prefersReducedMotion);
  const resumeTimerRef = useRef(null);
  const trackRef = useRef(null);
  const scrollSettleTimerRef = useRef(null);
  // 'program' when an index change should scroll the track; 'user' when the
  // index change came FROM the track's own scroll (skip re-scrolling).
  const scrollSourceRef = useRef('program');

  // Fetch on mount if not already loaded
  useEffect(() => {
    if (onFetchHeroBrands && heroBrands.length === 0 && !fetchInProgress) {
      onFetchHeroBrands();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance every 8s
  useEffect(() => {
    if (!isAutoPlaying || heroBrands.length < 2) return;
    const interval = setInterval(() => {
      setCurrentBrandIndex(prev => (prev + 1) % heroBrands.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlaying, heroBrands.length]);

  // Clamp index if brands list shrinks
  useEffect(() => {
    if (heroBrands.length > 0 && currentBrandIndex >= heroBrands.length) {
      setCurrentBrandIndex(0);
    }
  }, [heroBrands.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
    };
  }, []);

  // Keep the scroll-snap track in sync with the active index (autoplay, dots,
  // arrows). Index changes that originated from the track's own scroll skip
  // this — the track is already there.
  useEffect(() => {
    if (scrollSourceRef.current === 'user') {
      scrollSourceRef.current = 'program';
      return;
    }
    const track = trackRef.current;
    const slide = track?.children?.[currentBrandIndex];
    if (!track || !slide) return;
    const left = slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
    track.scrollTo({ left, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [currentBrandIndex, heroBrands.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
    goToBrand((currentBrandIndex - 1 + heroBrands.length) % heroBrands.length);

  const goToNext = () =>
    goToBrand((currentBrandIndex + 1) % heroBrands.length);

  // Derive the active slide from scroll position once scrolling settles.
  // Native scroll-snap owns the swipe gesture; this keeps dots/autoplay in sync.
  const handleTrackScroll = () => {
    if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
    scrollSettleTimerRef.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track || track.children.length === 0) return;
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let nearestDistance = Infinity;
      Array.from(track.children).forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const distance = Math.abs(slideCenter - trackCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      });
      setCurrentBrandIndex(prev => {
        if (nearest === prev) return prev;
        scrollSourceRef.current = 'user';
        return nearest;
      });
    }, SCROLL_SETTLE_MS);
  };

  // Touch: pause autoplay while the user is interacting; native scroll-snap
  // handles the swipe itself.
  const handleTouchStart = () => {
    setIsAutoPlaying(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleTouchEnd = () => {
    scheduleResume(TOUCH_PAUSE_DURATION);
  };

  // Desktop trackpad: pause when the user scrolls the track horizontally
  const handleTrackWheel = e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      setIsAutoPlaying(false);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      scheduleResume(MANUAL_PAUSE_DURATION);
    }
  };

  // Desktop: pause on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleMouseLeave = () => {
    scheduleResume(MANUAL_PAUSE_DURATION);
  };

  // Explicit pause/play toggle for the auto-advancing carousel (WCAG 2.2.2).
  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    } else {
      setIsAutoPlaying(true);
    }
  };

  // Breadth signal (T1-7): threshold-gated numeric vs. qualitative label.
  const brandCount = getAllBrandIds().length;
  const categoryCount = getPopulatedCategoryCount();
  const showBreadthNumber =
    brandCount >= BREADTH_MIN_BRANDS && categoryCount >= BREADTH_MIN_CATEGORIES;

  const categoryPills = (
    <div className={css.categoryPillsWrapper}>
      <span className={css.pillsLabel}>
        <FormattedMessage
          id="SectionMelaHero.categoryPillsLabel"
          defaultMessage="Or jump into a category"
        />
      </span>
      <div className={css.categoryPills}>
        {TOP_CATEGORY_PILLS.map(({ id, label }) => (
          <Link key={id} to={`/categories/${id}`} className={css.categoryPill}>
            <CategoryIcon categoryId={id} size={18} className={css.pillIcon} />
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
          defaultMessage="Modern brands, rooted in India's rich, regional culture."
        />
      </h1>
      <p className={css.subheadline}>
        <FormattedMessage
          id="SectionMelaHero.heroSubheadline"
          defaultMessage="Independent Indian brands worth knowing — modern design, real makers, shipped to your door worldwide."
        />
      </p>
    </div>
  );

  // Trust badges + primary CTA: renders after the carousel on mobile so social
  // proof (the brand card) comes before the ask. On desktop it sits left-bottom.
  const ctaBlock = (
    <div className={css.ctaBlock}>
      {/* Breadth signal renders only as a real number (≥ threshold). The
          qualitative label was redundant with the H1 + why-line, so below
          threshold the labeled category pills carry breadth instead. */}
      {showBreadthNumber && (
        <p className={css.breadthSignal}>
          <FormattedMessage
            id="SectionMelaHero.breadthCount"
            defaultMessage="{brandCount}+ brands across {categoryCount} categories · shipped across the US"
            values={{ brandCount, categoryCount }}
          />
        </p>
      )}
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
  if (fetchInProgress && heroBrands.length === 0) {
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
  if (heroBrands.length === 0) {
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

  const hasMultiple = heroBrands.length > 1;

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

            {/* Scroll-snap track: 88%-wide slides with next-card peek on
                mobile; single 340px slide on desktop. All slides are in the
                DOM (keyboard/tab-reachable), snap owns the swipe gesture. */}
            <div
              className={css.brandTrack}
              ref={trackRef}
              onScroll={handleTrackScroll}
              onWheel={handleTrackWheel}
              aria-roledescription="carousel"
              aria-label={intl.formatMessage({
                id: 'HeroSection.carouselLabel',
                defaultMessage: 'Featured brands',
              })}
            >
              {heroBrands.map((item, index) => (
                <div
                  className={css.trackSlide}
                  key={item.brand.id.uuid}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={intl.formatMessage(
                    { id: 'HeroSection.slideLabel', defaultMessage: '{position} of {total}: {brandName}' },
                    {
                      position: index + 1,
                      total: heroBrands.length,
                      brandName: item.brand?.attributes?.profile?.displayName || String(index + 1),
                    }
                  )}
                >
                  <BrandHeroCard
                    brand={item.brand}
                    heroImageUrlById={item.heroImageUrlById}
                    isPriority={index === 0}
                  />
                </div>
              ))}
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
              <div className={css.carouselControls}>
                <div className={css.productDots}>
                  {heroBrands.map((item, index) => (
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
                <button
                  type="button"
                  className={css.pausePlayButton}
                  onClick={toggleAutoPlay}
                  aria-label={intl.formatMessage({
                    id: isAutoPlaying ? 'HeroSection.pauseRotation' : 'HeroSection.playRotation',
                    defaultMessage: isAutoPlaying ? 'Pause brand rotation' : 'Play brand rotation',
                  })}
                >
                  {isAutoPlaying ? '❚❚' : '►'}
                </button>
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
  heroBrands: getHeroBrands(state),
  fetchInProgress: getHeroBrandsInProgress(state),
  fetchError: getHeroBrandsError(state),
});

const mapDispatchToProps = {
  onFetchHeroBrands: fetchHeroBrands,
};

const HeroSection = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(HeroSectionComponent);

export default HeroSection;
