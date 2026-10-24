import React from 'react';
import { arrayOf, shape, string } from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import { DEFAULT_CATEGORY_TILES } from '../CategoryTiles/CategoryTiles';

import css from './CategoryChips.module.css';

/**
 * CategoryChips — text-only category links that wrap onto as many rows as they need,
 * so no category is cut off at phone width. A lighter alternative to CategoryTiles for
 * places where categories sit under another module (homepage "Shop by occasion").
 *
 * Uses the same category list as CategoryTiles and links to `/categories/:id`.
 *
 * @component
 * @param {Object} props
 * @param {Array<{id: string, label: string}>} [props.categories] chips to render
 * @param {string} [props.className] extra classes on the root
 * @param {string} [props.rootClassName] overrides css.root
 */
const CategoryChips = props => {
  const { categories = DEFAULT_CATEGORY_TILES, className = null, rootClassName = null } = props;
  const intl = useIntl();

  return (
    <nav
      className={classNames(rootClassName || css.root, className)}
      aria-label={intl.formatMessage({ id: 'CategoryChips.label' })}
    >
      <ul className={css.list}>
        {categories.map(({ id, label }) => (
          <li key={id}>
            <Link to={`/categories/${id}`} className={css.chip}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

CategoryChips.propTypes = {
  categories: arrayOf(
    shape({
      id: string.isRequired,
      label: string.isRequired,
    })
  ),
  className: string,
  rootClassName: string,
};

export default CategoryChips;
