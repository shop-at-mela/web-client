import React from 'react';
import { string, arrayOf, shape, func } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '../../components';
import { ListingCardMini } from '../ListingCardMini/ListingCardMini';

import css from './BrandCard.module.css';

/**
 * Shop-style BrandCard showing brand + up to 4 featured products in 2x2 grid
 *
 * @param {Object} props
 * @param {Object} props.brand - Brand user entity
 * @param {Array} props.products - Array of listing entities (up to 4)
 * @param {Function} props.onFavorite - Callback when favorite button clicked
 * @param {string} props.className - Additional CSS class
 * @param {string} props.rootClassName - Root CSS class override
 */
const BrandCard = props => {
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

  const { displayName, publicData } = brand.attributes?.profile || {};
  const { certifications = [] } = publicData || {};
  const profileImage = brand.profileImage;

  const logoSrc =
    publicData?.brandLogoUrl || profileImage?.attributes?.variants?.['square-small']?.url;

  const logoInitial = displayName?.charAt(0) || 'B';

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
            <div className={css.logoPlaceholder}>{logoInitial}</div>
          )}
          <h3 className={css.brandName}>{displayName}</h3>
        </div>

        {/* Future: Options menu */}
        {/* <button className={css.menuButton}>⋮</button> */}
      </div>

      {/* Certification Badge */}
      {certifications.length > 0 && (
        <div className={css.certBadge}>
          {certifications[0] === 'gots_certified' ? 'GOTS' : certifications[0]}
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

BrandCard.propTypes = {
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
export default React.memo(BrandCard, (prevProps, nextProps) => {
  return (
    prevProps.brand.id.uuid === nextProps.brand.id.uuid &&
    prevProps.products.length === nextProps.products.length
  );
});
