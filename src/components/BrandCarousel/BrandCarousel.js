import React from 'react';
import { arrayOf, func, oneOf, shape, string } from 'prop-types';
import classNames from 'classnames';
import css from './BrandCarousel.module.css';

/**
 * BrandCarousel — shared horizontal-scroll brand carousel.
 * Used by EarnedItsPlace (homepage), FeaturedBrandPartners, BrandsPage (/brands)
 * and CategoryPage.
 *
 * Two-layer structure mirrors ProductCarousel:
 *   .root  (overflow-x: hidden) — clips scroll content to component bounds
 *   .carousel (overflow-x: auto) — the actual scrollable flex row
 *
 * className is applied to .root for external spacing/positioning.
 *
 * cardSize="wide" shows ~2.5 cards from 1024px up instead of ~3.3 (homepage
 * Earned Its Place only, 2026-11-27). The default keeps /brands and category
 * pages unchanged.
 */
const BrandCarousel = ({ items, renderItem, getKey, className, cardSize }) => (
  <div className={classNames(css.root, className)}>
    <div className={css.carousel}>
      {items.map((item, i) => (
        <div
          key={getKey ? getKey(item) : i}
          className={classNames(css.card, { [css.cardWide]: cardSize === 'wide' })}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  </div>
);

BrandCarousel.propTypes = {
  items: arrayOf(shape({})).isRequired,
  renderItem: func.isRequired,
  getKey: func,
  className: string,
  cardSize: oneOf(['default', 'wide']),
};

export default BrandCarousel;
