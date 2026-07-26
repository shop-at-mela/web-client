import React, { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { richText } from '../../util/richText';
import {
  Heading,
  H2,
  H3,
  H4,
  ListingCard,
  LinkTabNavHorizontal,
  NamedLink,
  RedirectTrustSheet,
} from '../../components';
import CertificationBadge from '../../components/CertificationBadge/CertificationBadge';
import BrandStorySection from './BrandStorySection';
import BrandOccasionModule from './BrandOccasionModule';
import { getCertification } from '../../config/certifications';
import { getBrandSlugById } from '../../config/configBrands';
import { openBrandStorefront } from '../../util/analytics/brandClickout';
import { shouldShowRedirectTrust, markRedirectTrustShown } from '../../util/sentimentCapture';

import css from './BrandStorefront.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;
const MAX_MOBILE_SCREEN_WIDTH = 768;

/**
 * Placeholder component shown to brand owners when they're missing data
 */
const BrandDataPlaceholder = ({ type, missingFields, isOwner }) => {
  if (!isOwner) return null;

  const placeholderContent = {
    logo: {
      icon: '📸',
      title: 'BrandStorefront.placeholder.logo.title',
      description: 'BrandStorefront.placeholder.logo.description',
    },
    tagline: {
      icon: '✏️',
      title: 'BrandStorefront.placeholder.tagline.title',
      description: 'BrandStorefront.placeholder.tagline.description',
    },
    origin: {
      icon: '📍',
      title: 'BrandStorefront.placeholder.origin.title',
      description: 'BrandStorefront.placeholder.origin.description',
    },
    certifications: {
      icon: '🏆',
      title: 'BrandStorefront.placeholder.certifications.title',
      description: 'BrandStorefront.placeholder.certifications.description',
    },
    products: {
      icon: '📦',
      title: 'BrandStorefront.placeholder.products.title',
      description: 'BrandStorefront.placeholder.products.description',
    },
  };

  const content = placeholderContent[type] || placeholderContent.tagline;

  return (
    <div className={css.placeholder}>
      <div className={css.placeholderIcon}>{content.icon}</div>
      <div className={css.placeholderContent}>
        <h4 className={css.placeholderTitle}>
          <FormattedMessage id={content.title} />
        </h4>
        <p className={css.placeholderDescription}>
          <FormattedMessage id={content.description} />
        </p>
        <NamedLink name="ProfileSettingsPage" className={css.placeholderCta}>
          <FormattedMessage id="BrandStorefront.placeholder.cta" />
        </NamedLink>
      </div>
    </div>
  );
};

/**
 * CertificationDetail - Shows certification badge + explanation + brand's proof
 * Uses centralized certification definitions to ensure consistent explanations
 */
const CertificationDetail = ({ certificationData }) => {
  // certificationData can be either:
  // 1. String (legacy): 'gots_certified'
  // 2. Object (new): { type: 'gots_certified', certificateUrl: '...', validThrough: '...' }

  const certType = typeof certificationData === 'string' ? certificationData : certificationData?.type;
  const certDefinition = getCertification(certType);

  if (!certDefinition) return null;

  const certificateUrl = typeof certificationData === 'object' ? certificationData.certificateUrl : null;
  const validThrough = typeof certificationData === 'object' ? certificationData.validThrough : null;
  const issuedBy = typeof certificationData === 'object' ? certificationData.issuedBy : null;

  return (
    <div className={css.certificationDetail}>
      <div className={css.certificationHeader}>
        <CertificationBadge
          certification={certType}
          variant="default"
          size={24}
          showTooltip={false}
        />
        <div className={css.certificationHeaderText}>
          <h5 className={css.certificationName}>{certDefinition.name}</h5>
          {certDefinition.tagline && (
            <p className={css.certificationTagline}>{certDefinition.tagline}</p>
          )}
        </div>
      </div>

      <div className={css.certificationBody}>
        {certDefinition.consumerBenefit && (
          <p className={css.certificationBenefit}>{certDefinition.consumerBenefit}:</p>
        )}
        <ul className={css.certificationFeatures}>
          {certDefinition.description.map((feature, index) => (
            <li key={index} className={css.certificationFeature}>
              {feature}
            </li>
          ))}
        </ul>

        {/* Brand-specific proof */}
        {(certificateUrl || issuedBy || validThrough) && (
          <div className={css.certificationProof}>
            {issuedBy && (
              <p className={css.certificationIssuer}>
                <strong>Certified by:</strong> {issuedBy}
              </p>
            )}
            {validThrough && (
              <p className={css.certificationValidity}>
                <strong>Valid through:</strong> {new Date(validThrough).toLocaleDateString()}
              </p>
            )}
            {certificateUrl && (
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={css.certificateLink}
              >
                View Certificate (PDF)
              </a>
            )}
          </div>
        )}

        {/* Educational link */}
        {certDefinition.learnMoreUrl && (
          <a
            href={certDefinition.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={css.learnMoreLink}
          >
            Learn more about {certDefinition.shortName}
          </a>
        )}
      </div>
    </div>
  );
};

/**
 * BrandStorefront - Enhanced profile page layout for brand providers
 *
 * This component transforms the standard ProfilePage into a brand storefront with:
 * - Prominent brand header with logo, tagline, origin, established year
 * - Certification badges
 * - Tab navigation (Products, About, Reviews)
 * - Enhanced product showcase
 * - Brand story/mission section
 * - Full-width layout (no sidebar redundancy)
 *
 * When the logged-in user is viewing their own profile, shows helpful placeholders
 * for missing brand data to guide them through profile completion.
 *
 * Used when viewing a user profile that has provider role and brand-related data.
 *
 * @param {Object} props
 * @param {Object} props.user - Brand user entity
 * @param {Array} props.listings - Brand's product listings
 * @param {Object} props.currentUser - Currently logged in user
 * @param {boolean} props.isCurrentUser - True if viewing own profile
 * @param {Object} props.intl - Intl instance for formatting
 */
const BrandStorefront = props => {
  const {
    user,
    listings = [],
    userTypeRoles,
    currentUser,
    isCurrentUser,
    variant,
  } = props;

  const [mounted, setMounted] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [redirectSheetOpen, setRedirectSheetOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null);
  const observerRef = React.useRef(null);

  // Determine active tab from route variant (default to 'products')
  const activeTab = variant === 'about' ? 'about' : 'products';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Callback ref: sets up IntersectionObserver whenever the sentinel element mounts.
  // useEffect with [] misses async listing loads because the element doesn't exist on mount.
  const loadMoreRef = React.useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisibleProducts(prev => prev + 12);
      },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(node);
  }, []);

  // Early return if user data is not available
  if (!user || !user.attributes || !user.attributes.profile) {
    return null;
  }

  const intl = useIntl();
  const { displayName, bio, publicData = {} } = user.attributes.profile;
  const {
    certifications = [],
    brandTagline,
    brandStory,
    brandLogoUrl,
    brandOrigin,
    brandCity,
    brandCountry,
    establishedYear,
    foundedYear,
    brandStoreUrl,
    brandHeroImages,
    brandCraft,
    melaVetted,
  } = publicData;

  const profileImage = user?.profileImage;
  const logoSrc = brandLogoUrl || profileImage?.attributes?.variants?.['square-small']?.url;
  const heroImageUrl = Array.isArray(brandHeroImages) && brandHeroImages.length > 0 ? brandHeroImages[0] : null;

  // Format brand origin
  const origin =
    brandOrigin ||
    (brandCity && brandCountry ? `${brandCity}, ${brandCountry}` : brandCountry || null);

  // Format establishment year
  const yearEstablished = establishedYear || foundedYear;

  // Tagline: Use brandTagline if available, fallback to bio first sentence (legacy support)
  const tagline = brandTagline || (bio ? bio.split('.')[0].trim().substring(0, 120) : null);

  // Story: Use brandStory if available, fallback to bio (legacy support)
  const story = brandStory || bio;

  // Hero band shows only the opening of the story (~2 paragraphs); the full text
  // stays in the About tab via BrandStorySection, unchanged. Only shown when a
  // dedicated brandStory exists — falling back to `bio` here would just repeat
  // the tagline (also bio-derived) as a second, redundant block of copy.
  const heroStorySummary = brandStory
    ? brandStory
        .split(/\n\s*\n/)
        .filter(Boolean)
        .slice(0, 2)
        .join(' ')
    : null;

  const hasCertifications = certifications.length > 0;
  const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
  const isMobileLayout =
    mounted && hasMatchMedia
      ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
      : true;

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.id?.uuid === user?.id?.uuid;

  // P0.2: exclude $0 promo SKUs from every public grid on this page.
  const sellableListings = listings.filter(listing => (listing.attributes?.price?.amount ?? 0) > 0);
  const hasListings = sellableListings.length > 0;

  // Featured products (first 3-4 products for horizontal scroll)
  const featuredProducts = sellableListings.slice(0, isMobileLayout ? 3 : 4);
  const hasFeaturedProducts = featuredProducts.length > 0;

  // Remove featured products from main grid to avoid duplication, then curate:
  // bestsellers first (existing isBestseller signal), original order otherwise.
  // There is no data flag for "utility/basic" items yet, so we only surface the
  // positive "hero product" signal — see PRD storefront-validation-readiness §8.
  const nonFeaturedProducts = sellableListings
    .filter(listing => !featuredProducts.some(fp => fp.id.uuid === listing.id.uuid))
    .slice()
    .sort((a, b) => {
      const aBest = a.attributes?.publicData?.isBestseller ? 1 : 0;
      const bBest = b.attributes?.publicData?.isBestseller ? 1 : 0;
      return bBest - aBest;
    });
  const hasNonFeaturedProducts = nonFeaturedProducts.length > 0;

  // Lazy loading: Only show visible products
  const displayedProducts = nonFeaturedProducts.slice(0, visibleProducts);
  const hasMoreProducts = visibleProducts < nonFeaturedProducts.length;

  // User ID for routing
  const userId = user?.id?.uuid;
  const brandSlug = userId ? getBrandSlugById(userId) : null;

  const productsLinkProps = brandSlug
    ? { name: 'BrandPage', params: { brandSlug } }
    : { name: 'ProfilePage', params: { id: userId } };
  const aboutLinkProps = brandSlug
    ? { name: 'BrandPageVariant', params: { brandSlug, variant: 'about' } }
    : { name: 'ProfilePageVariant', params: { id: userId, variant: 'about' } };

  // Tab configuration - using routes instead of scroll anchors
  const tabs = [
    {
      text: (
        <span className={css.tabLabel}>
          <FormattedMessage id="BrandStorefront.productsTab" values={{ count: sellableListings.length }} />
        </span>
      ),
      selected: activeTab === 'products',
      linkProps: productsLinkProps,
    },
    {
      text: (
        <span className={css.tabLabel}>
          <FormattedMessage id="BrandStorefront.aboutTab" />
        </span>
      ),
      selected: activeTab === 'about',
      linkProps: aboutLinkProps,
    },
  ];

  const handleVisitStoreClick = () => {
    if (!brandStoreUrl) return;
    const trackingParams = { brandName: displayName, brandId: userId };
    if (shouldShowRedirectTrust()) {
      markRedirectTrustShown();
      setPendingRedirectUrl(brandStoreUrl);
      setRedirectSheetOpen(true);
    } else {
      openBrandStorefront(brandStoreUrl, trackingParams);
    }
  };

  return (
    <div className={css.root}>
      {/* Edit Profile Link for Owner (Top Right) */}
      {isCurrentUser && (
        <div className={css.editProfileBar}>
          <NamedLink name="ProfileSettingsPage" className={css.editProfileLink}>
            <span className={css.editIcon}>⚙️</span>
            <FormattedMessage id="ProfilePage.editProfileLinkDesktop" />
          </NamedLink>
        </div>
      )}

      {/* Brand Hero Band (P1.1) */}
      <div className={css.brandHeader}>
        <div className={css.heroMedia}>
          {heroImageUrl ? (
            <img src={heroImageUrl} alt={displayName} className={css.heroImg} />
          ) : (
            <div className={css.heroImgFallback} aria-hidden="true" />
          )}
          <span className={css.madeInIndia}>
            <FormattedMessage id="BrandStorefront.madeInIndia" />
          </span>

          {/* Brand Logo */}
          <div className={css.logoContainer}>
            {logoSrc ? (
              <img src={logoSrc} alt={displayName} className={css.brandLogo} />
            ) : (
              <div className={css.logoPlaceholder}>
                <span className={css.logoInitial}>{displayName?.charAt(0) || 'B'}</span>
              </div>
            )}
          </div>
        </div>

        <div className={css.brandHeaderContent}>
          {!logoSrc && isOwnProfile && (
            <div className={css.inlinePlaceholder}>
              <BrandDataPlaceholder type="logo" isOwner={isOwnProfile} />
            </div>
          )}

          {melaVetted === true && (
            <span className={css.vettedBadge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="M4 12l5 5L20 6" />
              </svg>
              <FormattedMessage id="BrandStorefront.vettedBadge" />
            </span>
          )}

          {/* Brand Info */}
          <div className={css.brandInfo}>
            <H2 as="h1" className={css.brandName}>
              {displayName}
            </H2>

            {tagline ? (
              <p className={css.tagline}>{tagline}</p>
            ) : isOwnProfile ? (
              <div className={css.inlinePlaceholder}>
                <BrandDataPlaceholder type="tagline" isOwner={isOwnProfile} />
              </div>
            ) : null}

            {/* Brand Origin & Established Year */}
            {origin || yearEstablished ? (
              <div className={css.brandMeta}>
                {origin && <span className={css.origin}>{origin}</span>}
                {origin && yearEstablished && <span className={css.separator}>•</span>}
                {yearEstablished && (
                  <span className={css.established}>
                    <FormattedMessage
                      id="BrandStorefront.established"
                      values={{ year: yearEstablished }}
                    />
                  </span>
                )}
              </div>
            ) : isOwnProfile ? (
              <div className={css.inlinePlaceholder}>
                <BrandDataPlaceholder type="origin" isOwner={isOwnProfile} />
              </div>
            ) : null}

            {/* Marketplace-wide trust facts — always shown, not brand data */}
            <div className={css.heroMetaStatic}>
              <span>
                <FormattedMessage
                  id="BrandStorefront.productsCount"
                  values={{ count: sellableListings.length }}
                />
              </span>
              <span className={css.separator}>•</span>
              <span>
                <FormattedMessage id="BrandStorefront.metaShipping" />
              </span>
              <span className={css.separator}>•</span>
              <span>
                <FormattedMessage id="BrandStorefront.metaCards" />
              </span>
            </div>

            {/* Certification Badges */}
            {hasCertifications ? (
              <div className={css.certifications}>
                {certifications.map(cert => (
                  <CertificationBadge
                    key={cert}
                    certification={cert}
                    variant="default"
                    size={18}
                    showTooltip={true}
                  />
                ))}
              </div>
            ) : isOwnProfile ? (
              <div className={css.inlinePlaceholder}>
                <BrandDataPlaceholder type="certifications" isOwner={isOwnProfile} />
              </div>
            ) : null}

            {heroStorySummary && (
              <p className={css.heroStory}>
                {heroStorySummary}{' '}
                <NamedLink {...aboutLinkProps} className={css.readFullStoryLink}>
                  <FormattedMessage id="BrandStorefront.readFullStory" />
                </NamedLink>
              </p>
            )}

            {brandCraft && (
              <span className={css.craftChip}>
                ✦ <FormattedMessage id="BrandStorefront.craftLabel" /> {brandCraft}
              </span>
            )}

            <div className={css.ctaCol}>
              {brandStoreUrl && (
                <button type="button" className={css.btnPrimary} onClick={handleVisitStoreClick}>
                  <FormattedMessage id="BrandStorefront.visitStore" values={{ brand: displayName }} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </button>
              )}
              {hasListings &&
                (activeTab === 'products' ? (
                  <a className={css.btnSecondary} href="#brand-products-grid">
                    <FormattedMessage
                      id="BrandStorefront.browseProducts"
                      values={{ count: sellableListings.length }}
                    />
                  </a>
                ) : (
                  <NamedLink {...productsLinkProps} className={css.btnSecondary}>
                    <FormattedMessage
                      id="BrandStorefront.browseProducts"
                      values={{ count: sellableListings.length }}
                    />
                  </NamedLink>
                ))}
            </div>

            {brandStoreUrl && (
              <p className={css.redirectMicrocopy}>
                <strong>
                  <FormattedMessage id="BrandStorefront.howMelaWorksLabel" />
                </strong>{' '}
                <FormattedMessage id="BrandStorefront.redirectMicrocopy" />
              </p>
            )}
          </div>
        </div>
      </div>

      {redirectSheetOpen && pendingRedirectUrl && (
        <RedirectTrustSheet
          isOpen={redirectSheetOpen}
          brandName={displayName}
          productUrl={pendingRedirectUrl}
          isVerified={hasCertifications}
          onContinue={url => openBrandStorefront(url, { brandName: displayName, brandId: userId })}
          onClose={() => setRedirectSheetOpen(false)}
        />
      )}

      {/* Tab Navigation */}
      <div className={css.tabNavigation}>
        <LinkTabNavHorizontal className={css.tabs} tabs={tabs} />
      </div>

      {/* Tab Content */}
      <div className={css.tabContent}>
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div id="brand-products-grid" className={css.productsSection}>
            {/* Featured Products - Horizontal Scroll (Products tab only) */}
            {hasFeaturedProducts && (
              <div className={css.featuredSection}>
                <div className={css.featuredHeader}>
                  <H3 className={css.featuredTitle}>
                    <FormattedMessage id="BrandStorefront.featuredProducts" />
                  </H3>
                </div>
                <div className={css.featuredScroll}>
                  {featuredProducts.map(listing => (
                    <div className={css.featuredItem} key={listing.id.uuid}>
                      <ListingCard
                        listing={listing}
                        showAuthorInfo={false}
                        showTrustBadges={true}
                        showConversionBadges={true}
                        isBestseller={listing.attributes?.publicData?.isBestseller || false}
                        renderSizes="(max-width: 767px) 85vw, (max-width: 1279px) 48vw, 23vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shop by Occasion - this brand's Diwali & Festivals / Gifting picks */}
            <BrandOccasionModule listings={sellableListings} brandUserId={userId} />

            {/* All Products Grid */}
            {hasNonFeaturedProducts && (
              <div className={css.allProductsSection}>
                <div className={css.allProductsHeader}>
                  <H3 className={css.allProductsTitle}>
                    <FormattedMessage id="BrandStorefront.allProducts" />
                  </H3>
                  <span className={css.curatedOrderNote}>
                    <FormattedMessage id="BrandStorefront.curatedOrderNote" />
                  </span>
                </div>
                <ul className={css.productGrid}>
                  {displayedProducts.map(listing => (
                    <li className={css.productItem} key={listing.id.uuid}>
                      <ListingCard
                        listing={listing}
                        showAuthorInfo={false}
                        showTrustBadges={true}
                        showConversionBadges={true}
                        isBestseller={listing.attributes?.publicData?.isBestseller || false}
                        renderSizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
                      />
                    </li>
                  ))}
                </ul>
                {/* Lazy loading trigger element */}
                {hasMoreProducts && <div ref={loadMoreRef} className={css.loadMoreTrigger} />}
              </div>
            )}

            {!hasListings && isOwnProfile && (
              <BrandDataPlaceholder type="products" isOwner={isOwnProfile} />
            )}

            {!hasListings && !isOwnProfile && (
              <p className={css.emptyState}>
                <FormattedMessage id="BrandStorefront.noProducts" />
              </p>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className={css.aboutSection}>

            {/* Brand Story with Read More */}
            {story && (
              <BrandStorySection
                brandStory={story}
                previewLength={isMobileLayout ? 150 : 300}
                isOwnProfile={isOwnProfile}
              />
            )}

            {/* Certifications Detail */}
            {hasCertifications ? (
              <div className={css.certificationsDetail}>
                <H4 className={css.sectionSubtitle}>
                  <FormattedMessage id="BrandStorefront.certifications" />
                </H4>
                <div className={css.certificationsList}>
                  {certifications.map((cert, index) => (
                    <CertificationDetail
                      key={typeof cert === 'string' ? cert : cert.type}
                      certificationData={cert}
                    />
                  ))}
                </div>
              </div>
            ) : isOwnProfile ? (
              <BrandDataPlaceholder type="certifications" isOwner={isOwnProfile} />
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
};

export default BrandStorefront;
