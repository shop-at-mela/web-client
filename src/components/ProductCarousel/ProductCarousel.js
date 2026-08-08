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
 *
 * `showAuthorInfo`/`showTrustBadges`/`showConversionBadges` default to the trust-badge
 * presentation used by the catalog carousels (CategoryShowcase, BrandSpotlight) — pass
 * overrides for editorial modules that want a different ListingCard content mix (e.g.
 * NewFromIndia shows the brand name instead of badges).
 *
 * `title` is optional — omit it (and `viewAllLinkName`) to render just the scrollable
 * row with no header, for hosts that already render their own heading (e.g. OccasionCard's
 * gradient editorial header). Pass `renderSizes` when the carousel is nested in a
 * container narrower than the full page width, since the default hint assumes a
 * near-full-width carousel.
 */

import React from 'react';
import { arrayOf, bool, func, number, object, string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { NamedLink, ListingCard } from '../../components';
import css from './ProductCarousel.module.css';

const ProductCarousel = ({
  title,
  subtitle,
  viewAllLinkName,
  viewAllLinkParams,
  viewAllLinkSearch,
  listings = [],
  isLoading = false,
  minItems = 2,
  className,
  showInrPrice = true,
  showAuthorInfo = false,
  showTrustBadges = true,
  showConversionBadges = true,
  renderSizes = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw',
  onItemClick,
}) => {
  const listingsWithImages = listings.filter(l => l.images && l.images.length > 0);

  if (!isLoading && listingsWithImages.length < minItems) return null;

  const hasHeader = Boolean(title || viewAllLinkName);

  return (
    <div className={className || css.root}>
      {hasHeader && (
        <div className={css.header}>
          <div className={css.headerText}>
            {title && <h3 className={css.title}>{title}</h3>}
            {subtitle && <p className={css.subtitle}>{subtitle}</p>}
          </div>
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
      )}

      <div className={css.carousel}>
        {isLoading
          ? [1, 2, 3, 4].map(i => (
              <div key={i} className={`${css.card} ${css.skeleton}`} />
            ))
          : listingsWithImages.map((listing) => (
              <div
                key={listing.id.uuid}
                className={css.card}
                onClick={onItemClick ? () => onItemClick(listing) : undefined}
              >
                <ListingCard
                  listing={listing}
                  showAuthorInfo={showAuthorInfo}
                  showTrustBadges={showTrustBadges}
                  showConversionBadges={showConversionBadges}
                  isBestseller={listing.attributes?.publicData?.isBestseller || false}
                  renderSizes={renderSizes}
                  showInrPrice={showInrPrice}
                />
              </div>
            ))}
      </div>
    </div>
  );
};

ProductCarousel.propTypes = {
  title: string,
  subtitle: string,
  viewAllLinkName: string,
  viewAllLinkParams: object,
  viewAllLinkSearch: string,
  listings: arrayOf(propTypes.listing),
  isLoading: bool,
  minItems: number,
  className: string,
  showInrPrice: bool,
  showAuthorInfo: bool,
  showTrustBadges: bool,
  showConversionBadges: bool,
  renderSizes: string,
  onItemClick: func,
};

export default ProductCarousel;
