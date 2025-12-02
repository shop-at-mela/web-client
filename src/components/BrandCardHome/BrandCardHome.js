import React from 'react';
import { string, arrayOf, shape, func } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '../../components';
import { ListingCardMini } from '../ListingCardMini/ListingCardMini';
import CertificationBadge from '../CertificationBadge/CertificationBadge';

import css from './BrandCardHome.module.css';

/**
 * BrandCardHome - Enhanced BrandCard for homepage with authentic trust signals
 * Extends the Shop-style BrandCard with certifications, brand origin, and establishment year
 *
 * Trust signals are extracted from brand.attributes.profile.publicData:
 * - certifications: Array of certification types (displays all with icons)
 * - brandOrigin: "City, Country" or separate brandCity/brandCountry fields
 * - establishedYear: Year brand was founded
 *
 * Shows placeholder text when data is missing to prompt brand onboarding.
 *
 * @param {Object} props
 * @param {Object} props.brand - Brand user entity
 * @param {Array} props.products - Array of listing entities (up to 4)
 * @param {Function} props.onFavorite - Callback when favorite button clicked
 * @param {string} props.className - Additional CSS class
 * @param {string} props.rootClassName - Root CSS class override
 */
const BrandCardHome = props => {
  const {
    brand,
    products = [],
    onFavorite,
    className = null,
    rootClassName = null,
  } = props;

  if (!brand || !brand.id) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className);

  const { displayName, bio, publicData } = brand.attributes?.profile || {};
  const { certifications = [] } = publicData || {};
  const profileImage = brand.profileImage;

  const logoSrc =
    publicData?.brandLogoUrl || profileImage?.attributes?.variants?.['square-small']?.url;

  const logoInitial = displayName?.charAt(0) || 'B';

  // Extract first sentence from bio as tagline (max 80 chars)
  const firstSentence = bio ? bio.split('.')[0].trim() : '';
  const tagline = firstSentence
    ? firstSentence.substring(0, 80) + (firstSentence.length > 80 ? '...' : '')
    : null;

  // Extract brand origin (city, country)
  const brandOrigin =
    publicData?.brandOrigin ||
    (publicData?.brandCity && publicData?.brandCountry
      ? `${publicData.brandCity}, ${publicData.brandCountry}`
      : publicData?.brandCountry || null);

  // Extract establishment year
  const establishedYear = publicData?.establishedYear || publicData?.foundedYear || null;

  // Format brand info display
  const brandInfoParts = [brandOrigin, establishedYear && `Est. ${establishedYear}`].filter(
    Boolean
  );
  const brandInfo = brandInfoParts.length > 0 ? brandInfoParts.join(' · ') : null;

  // Show up to 4 products in 2x2 grid
  const featuredProducts = products.slice(0, 4);

  // Fill with placeholders if less than 4
  const gridProducts = [...featuredProducts];
  while (gridProducts.length < 4) {
    gridProducts.push(null); // Placeholder
  }

  return (
    <div className={classes}>
      {/* Header */}
      <div className={css.header}>
        <div className={css.brandInfo}>
          {logoSrc ? (
            <img src={logoSrc} alt={displayName} className={css.smallLogo} />
          ) : (
            <div className={css.logoPlaceholder}>
              {logoInitial}
              <span className={css.logoMissingIcon}>📸</span>
            </div>
          )}
          <div className={css.brandText}>
            <h3 className={css.brandName}>{displayName}</h3>

            {/* Tagline */}
            {tagline ? (
              <p className={css.tagline}>{tagline}</p>
            ) : (
              <p className={css.taglinePlaceholder}>
                <FormattedMessage id="BrandCardHome.addDescription" />
              </p>
            )}

            {/* Brand Origin & Established Year */}
            {brandInfo ? (
              <p className={css.brandOrigin}>{brandInfo}</p>
            ) : (
              <p className={css.brandOriginPlaceholder}>
                <FormattedMessage id="BrandCardHome.addOriginYear" />
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Certifications */}
      {certifications.length > 0 ? (
        <div className={css.certBadges}>
          {certifications.map(cert => (
            <CertificationBadge
              key={cert}
              certification={cert}
              variant="compact"
              size={14}
            />
          ))}
        </div>
      ) : (
        <div className={css.certPlaceholder}>
          <FormattedMessage id="BrandCardHome.addCertifications" />
        </div>
      )}

      {/* Product Grid (2x2) */}
      <div className={css.productGrid}>
        {gridProducts.map((product, index) =>
          product ? (
            <ListingCardMini
              key={product.id.uuid}
              listing={product}
              onFavorite={onFavorite}
              showFavorite={true}
            />
          ) : (
            <div key={`placeholder-${index}`} className={css.productPlaceholder}>
              <FormattedMessage id="BrandCard.noProduct" />
            </div>
          )
        )}
      </div>

      {/* Shop All CTA */}
      <NamedLink name="ProfilePage" params={{ id: brand.id.uuid }} className={css.cta}>
        <span className={css.ctaText}>
          <FormattedMessage id="BrandCard.shopAll" />
        </span>
        <span className={css.ctaArrow}>→</span>
      </NamedLink>
    </div>
  );
};

BrandCardHome.propTypes = {
  brand: shape({
    id: shape({
      uuid: string.isRequired,
    }).isRequired,
  }).isRequired,
  products: arrayOf(
    shape({
      id: shape({
        uuid: string.isRequired,
      }).isRequired,
    })
  ),
  onFavorite: func,
  className: string,
  rootClassName: string,
};

// Memoize to prevent unnecessary re-renders
export default React.memo(BrandCardHome, (prevProps, nextProps) => {
  return (
    prevProps.brand.id.uuid === nextProps.brand.id.uuid &&
    prevProps.products.length === nextProps.products.length &&
    prevProps.brand.attributes?.profile?.publicData === nextProps.brand.attributes?.profile?.publicData
  );
});
