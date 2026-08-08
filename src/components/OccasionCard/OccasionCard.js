import React from 'react';
import { arrayOf, bool, oneOf, shape, string } from 'prop-types';

import NamedLink from '../NamedLink/NamedLink';
import ListingCard from '../ListingCard/ListingCard';
import ProductCarousel from '../ProductCarousel/ProductCarousel';

import css from './OccasionCard.module.css';

/**
 * OccasionCard — one bold, editorial "Shop by Occasion" card.
 *
 * Inspiration + engagement, per the homepage-redesign mockup:
 *   1. a colored gradient editorial header (occasion title + one-line story) —
 *      leads with the moment, not the aisle;
 *   2. a curated peek of products — the engagement hook;
 *   3. a themed CTA into the full occasion search.
 *
 * The peek renders two different treatments depending on viewport, toggled purely
 * via CSS (both blocks are always in the DOM — same SSR-safe pattern as UserCard's
 * .mobileBio/.desktopBio split):
 *   - Mobile (<768px): a swipeable ProductCarousel showing all fetched products (up
 *     to 6). OccasionStrip's mobile layout stacks cards full-width, so the card's
 *     width ≈ viewport width — ProductCarousel's viewport-relative breakpoints fit
 *     as designed here.
 *   - Desktop (≥768px): the original static 2-up grid. OccasionStrip's desktop
 *     layout puts two OccasionCards side by side (each ~half the viewport), so
 *     ProductCarousel's breakpoints (tuned for near-full-width carousels elsewhere
 *     on the page) would render cards too small here — deferred until ProductCarousel
 *     gets a container-width-aware sizing option.
 *
 * Color themes map to Mela's brand palette:
 *   - 'gifting'  → indigo gradient  (calm, gift-y)
 *   - 'festive'  → marigold gradient (celebratory)
 *
 * Reusable across the homepage and any future occasion/collection surface
 * (e.g. a dedicated Gifting page).
 *
 * @component
 * @param {Object} props
 * @param {string} props.label occasion title (e.g. "Gifting", "Diwali & Festivals")
 * @param {string} [props.description] one-line story shown under the title
 * @param {'gifting'|'festive'} props.colorTheme brand color theme
 * @param {Array} [props.products] listing entities for the product peek
 * @param {boolean} [props.isLoading] show skeletons instead of the product peek
 * @param {string} props.ctaLabel CTA button text
 * @param {string} props.viewAllSearch SearchPage query string
 * @param {string} [props.className] extra classes on the root
 */
const PEEK_COUNT = 2;
const SKELETON_CARDS = [1, 2];

const OccasionCard = props => {
  const {
    label,
    description,
    colorTheme,
    products = [],
    isLoading = false,
    ctaLabel,
    viewAllSearch,
    className = null,
  } = props;

  const themeClass = colorTheme === 'festive' ? css.festive : css.gifting;
  const rootClasses = [css.card, themeClass, className].filter(Boolean).join(' ');
  const peekProducts = products.slice(0, PEEK_COUNT);

  return (
    <div className={rootClasses}>
      {/* Editorial header — colored gradient, occasion title + story. */}
      <div className={css.editorial}>
        <span className={css.bg} aria-hidden="true" />
        <span className={css.scrim} aria-hidden="true" />
        <div className={css.etext}>
          <h4 className={css.title}>{label}</h4>
          {description && <p className={css.story}>{description}</p>}
        </div>
      </div>

      {/* Mobile: swipeable peek of all fetched products. */}
      <div className={css.mobilePeek}>
        <ProductCarousel
          listings={products}
          isLoading={isLoading}
          minItems={PEEK_COUNT}
          showAuthorInfo={false}
          showTrustBadges={false}
          showConversionBadges={true}
          showInrPrice={false}
          renderSizes="(max-width: 767px) 45vw, 200px"
        />
      </div>

      {/* Desktop: static 2-up grid. */}
      <div className={css.desktopPeek}>
        {isLoading
          ? SKELETON_CARDS.map(i => <div key={i} className={css.peekSkeleton} />)
          : peekProducts.map(listing => (
              <div key={listing.id.uuid} className={css.peek}>
                <ListingCard
                  listing={listing}
                  showAuthorInfo={false}
                  showTrustBadges={false}
                  showConversionBadges={true}
                  isBestseller={listing.attributes?.publicData?.isBestseller || false}
                  renderSizes="(max-width: 767px) 45vw, 200px"
                  showInrPrice={false}
                />
              </div>
            ))}
      </div>

      {/* Themed CTA into the full occasion search. */}
      <div className={css.ctaRow}>
        <NamedLink name="SearchPage" to={{ search: viewAllSearch }} className={css.cta}>
          {ctaLabel} <span className={css.arrow}>→</span>
        </NamedLink>
      </div>
    </div>
  );
};

OccasionCard.propTypes = {
  label: string.isRequired,
  description: string,
  colorTheme: oneOf(['gifting', 'festive']).isRequired,
  products: arrayOf(
    shape({
      id: shape({ uuid: string.isRequired }).isRequired,
    })
  ),
  isLoading: bool,
  ctaLabel: string.isRequired,
  viewAllSearch: string.isRequired,
  className: string,
};

export default OccasionCard;
