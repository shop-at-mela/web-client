import React from 'react';
import { arrayOf, func, shape, string } from 'prop-types';
import classNames from 'classnames';
import css from './BrandCarousel.module.css';

/**
 * BrandCarousel — shared horizontal-scroll brand carousel.
 * Used by FeaturedBrandPartners (homepage) and BrandsPage (/brands).
 *
 * Two-layer structure mirrors ProductCarousel:
 *   .root  (overflow-x: hidden) — clips scroll content to component bounds
 *   .carousel (overflow-x: auto) — the actual scrollable flex row
 *
 * className is applied to .root for external spacing/positioning.
 */
const BrandCarousel = ({ items, renderItem, getKey, className }) => (
  <div className={classNames(css.root, className)}>
    <div className={css.carousel}>
      {items.map((item, i) => (
        <div key={getKey ? getKey(item) : i} className={css.card}>
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
};

export default BrandCarousel;
