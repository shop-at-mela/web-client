/**
 * ProductCarousel
 *
 * Shared horizontal-scroll product carousel used on the home page (via CategoryShowcase)
 * and on listing pages (RecommendedProducts, CategoryProducts).
 *
 * Cards use ListingCard with trust + conversion badges — the same presentation as the
 * home page carousel.
 *
 * Usage:
 *   <ProductCarousel
 *     title="You may also like"
 *     viewAllLinkName="BrandPage"
 *     viewAllLinkParams={{ brandSlug: 'aagghhoo' }}
 *     listings={recommendedProducts}
 *     isLoading={fetchInProgress}
 *   />
 */

import React from 'react';
import { arrayOf, bool, number, object, string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { NamedLink, ListingCard } from '../../components';
import css from './ProductCarousel.module.css';

const ProductCarousel = ({
  title,
  viewAllLinkName,
  viewAllLinkParams,
  viewAllLinkSearch,
  listings = [],
  isLoading = false,
  minItems = 2,
  className,
}) => {
  const listingsWithImages = listings.filter(l => l.images && l.images.length > 0);

  if (!isLoading && listingsWithImages.length < minItems) return null;

  return (
    <div className={className || css.root}>
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
        {viewAllLinkName && (
          <NamedLink
            name={viewAllLinkName}
            params={viewAllLinkParams}
            to={viewAllLinkSearch ? { search: viewAllLinkSearch } : undefined}
            className={css.viewAllLink}
          >
            <FormattedMessage id="ProductCarousel.viewAll" defaultMessage="View All" />
            <span className={css.arrow}>→</span>
          </NamedLink>
        )}
      </div>

      <div className={css.carousel}>
        {isLoading
          ? [1, 2, 3, 4].map(i => (
              <div key={i} className={`${css.card} ${css.skeleton}`} />
            ))
          : listingsWithImages.map((listing) => (
              <div key={listing.id.uuid} className={css.card}>
                <ListingCard
                  listing={listing}
                  showAuthorInfo={false}
                  showTrustBadges={true}
                  showConversionBadges={true}
                  isBestseller={listing.attributes?.publicData?.isBestseller || false}
                  renderSizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                />
              </div>
            ))}
      </div>
    </div>
  );
};

ProductCarousel.propTypes = {
  title: string.isRequired,
  viewAllLinkName: string,
  viewAllLinkParams: object,
  viewAllLinkSearch: string,
  listings: arrayOf(propTypes.listing),
  isLoading: bool,
  minItems: number,
  className: string,
};

export default ProductCarousel;
