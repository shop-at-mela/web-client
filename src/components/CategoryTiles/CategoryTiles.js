import React from 'react';
import { arrayOf, shape, string } from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import CategoryIcon from '../CategoryIcon/CategoryIcon';

import css from './CategoryTiles.module.css';

/**
 * CategoryTiles — compact, tap-in entry points to each product category.
 *
 * A tightened alternative to the homepage's per-category product carousels:
 * six large tiles, each an India-resonant line glyph (via CategoryIcon) + label,
 * linking to `/categories/:id`. Reused wherever a compact category nav is useful
 * (homepage "Shop by Category", and later category/landing surfaces).
 *
 * Category ids map 1:1 to CategoryIcon glyphs and to the hero's TOP_CATEGORY_PILLS,
 * so the same glyph repeats everywhere a category is named.
 *
 * @component
 * @param {Object} props
 * @param {Array<{id: string, label: string}>} [props.categories] tiles to render
 * @param {string} [props.className] extra classes on the root
 * @param {string} [props.rootClassName] overrides css.root
 */
export const DEFAULT_CATEGORY_TILES = [
  { id: 'Baby-Kids', label: 'Baby & Kids' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Home-Kitchen', label: 'Home & Kitchen' },
  { id: 'Jewelry-Accessories', label: 'Jewelry' },
  { id: 'Beauty-Wellness', label: 'Beauty' },
  { id: 'Art-Craft', label: 'Art & Craft' },
];

const CategoryTiles = props => {
  const { categories = DEFAULT_CATEGORY_TILES, className = null, rootClassName = null } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <h2 className={css.title}>
        <FormattedMessage id="MelaHomePage.categoryTitle" defaultMessage="Shop by Category" />
      </h2>

      <div className={css.grid}>
        {categories.map(({ id, label }) => (
          <Link key={id} to={`/categories/${id}`} className={css.tile}>
            <span className={css.iconWrap}>
              <CategoryIcon categoryId={id} size={24} className={css.icon} />
            </span>
            <span className={css.label}>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

CategoryTiles.propTypes = {
  categories: arrayOf(
    shape({
      id: string.isRequired,
      label: string.isRequired,
    })
  ),
  className: string,
  rootClassName: string,
};

export default CategoryTiles;
