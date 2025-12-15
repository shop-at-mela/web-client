import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { richText } from '../../util/richText';
import {
  Heading,
  H2,
  H3,
  H4,
  ListingCard,
  Reviews,
  ButtonTabNavHorizontal,
  NamedLink,
} from '../../components';
import CertificationBadge from '../../components/CertificationBadge/CertificationBadge';
import BrandStorySection from './BrandStorySection';
import { getCertification } from '../../config/certifications';

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
    mission: {
      icon: '🎯',
      title: 'BrandStorefront.placeholder.mission.title',
      description: 'BrandStorefront.placeholder.mission.description',
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
 * @param {Array} props.reviews - Brand reviews
 * @param {boolean} props.queryReviewsError - Reviews query error
 * @param {Object} props.currentUser - Currently logged in user
 * @param {boolean} props.isCurrentUser - True if viewing own profile
 * @param {Object} props.intl - Intl instance for formatting
 */
const BrandStorefront = props => {
  const {
    user,
    listings = [],
    reviews = [],
    queryReviewsError,
    userTypeRoles,
    currentUser,
    isCurrentUser,
    variant,
  } = props;

  const [mounted, setMounted] = useState(false);

  // Determine active tab from route variant (default to 'products')
  const activeTab = variant === 'about' ? 'about' : variant === 'reviews' ? 'reviews' : 'products';

  useEffect(() => {
    setMounted(true);
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
    brandMission,
    brandLogoUrl,
    brandOrigin,
    brandCity,
    brandCountry,
    establishedYear,
    foundedYear,
  } = publicData;

  const profileImage = user?.profileImage;
  const logoSrc = brandLogoUrl || profileImage?.attributes?.variants?.['square-small']?.url;

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

  const hasListings = listings.length > 0;
  const hasCertifications = certifications.length > 0;
  const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
  const isMobileLayout =
    mounted && hasMatchMedia
      ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
      : true;

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.id?.uuid === user?.id?.uuid;

  // Featured products (first 3-4 products for horizontal scroll)
  const featuredProducts = listings.slice(0, isMobileLayout ? 3 : 4);
  const hasFeaturedProducts = featuredProducts.length > 0;

  // User ID for routing
  const userId = user?.id?.uuid;

  // Tab configuration - using routes instead of scroll anchors
  const tabs = [
    {
      text: (
        <span className={css.tabLabel}>
          <FormattedMessage id="BrandStorefront.productsTab" values={{ count: listings.length }} />
        </span>
      ),
      selected: activeTab === 'products',
      linkProps: {
        name: 'ProfilePage',
        params: { id: userId },
      },
    },
    {
      text: (
        <span className={css.tabLabel}>
          <FormattedMessage id="BrandStorefront.aboutTab" />
        </span>
      ),
      selected: activeTab === 'about',
      linkProps: {
        name: 'ProfilePageVariant',
        params: { id: userId, variant: 'about' },
      },
    },
    {
      text: (
        <span className={css.tabLabel}>
          <FormattedMessage id="BrandStorefront.reviewsTab" values={{ count: reviews.length }} />
        </span>
      ),
      selected: activeTab === 'reviews',
      linkProps: {
        name: 'ProfilePageVariant',
        params: { id: userId, variant: 'reviews' },
      },
    },
  ];

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

      {/* Brand Header */}
      <div className={css.brandHeader}>
        <div className={css.brandHeaderContent}>
          {/* Brand Logo */}
          <div className={css.logoContainer}>
            {logoSrc ? (
              <img src={logoSrc} alt={displayName} className={css.brandLogo} />
            ) : isOwnProfile ? (
              <div className={classNames(css.logoPlaceholder, css.logoPlaceholderEmpty)}>
                <BrandDataPlaceholder type="logo" isOwner={isOwnProfile} />
              </div>
            ) : (
              <div className={css.logoPlaceholder}>
                <span className={css.logoInitial}>{displayName?.charAt(0) || 'B'}</span>
              </div>
            )}
          </div>

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
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={css.tabNavigation}>
        <ButtonTabNavHorizontal className={css.tabs} tabs={tabs} />
      </div>

      {/* Tab Content */}
      <div className={css.tabContent}>
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className={css.productsSection}>
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
                      <ListingCard listing={listing} showAuthorInfo={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasListings ? (
              <ul className={css.productGrid}>
                {listings.map(listing => (
                  <li className={css.productItem} key={listing.id.uuid}>
                    <ListingCard listing={listing} showAuthorInfo={false} />
                  </li>
                ))}
              </ul>
            ) : isOwnProfile ? (
              <BrandDataPlaceholder type="products" isOwner={isOwnProfile} />
            ) : (
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

            {/* Brand Mission */}
            {brandMission ? (
              <div className={css.brandMission}>
                <H4 className={css.sectionSubtitle}>
                  <FormattedMessage id="BrandStorefront.ourMission" />
                </H4>
                <p className={css.missionContent}>{brandMission}</p>
              </div>
            ) : isOwnProfile ? (
              <BrandDataPlaceholder type="mission" isOwner={isOwnProfile} />
            ) : null}

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

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className={css.reviewsSection}>

            {queryReviewsError ? (
              <p className={css.error}>
                <FormattedMessage id="ProfilePage.loadingReviewsFailed" />
              </p>
            ) : (
              <Reviews reviews={reviews} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandStorefront;
