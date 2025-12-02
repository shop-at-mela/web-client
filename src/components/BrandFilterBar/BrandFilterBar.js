import React from 'react';
import { string, number, func } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';

import css from './BrandFilterBar.module.css';

/**
 * BrandFilterBar component
 * Provides sorting and per-page controls for brands directory
 *
 * @param {Object} props
 * @param {string} props.sortBy - Current sort option
 * @param {Function} props.onSortChange - Handler for sort changes
 * @param {number} props.perPage - Current per page value
 * @param {Function} props.onPerPageChange - Handler for per page changes
 * @param {string} props.className - Additional CSS class
 */
const BrandFilterBar = props => {
  const {
    sortBy = 'alphabetical',
    onSortChange,
    perPage = 24,
    onPerPageChange,
    className = null,
  } = props;

  const intl = useIntl();
  const classes = classNames(css.root, className);

  const handleSortChange = e => {
    if (onSortChange) {
      onSortChange(e.target.value);
    }
  };

  const handlePerPageChange = e => {
    if (onPerPageChange) {
      onPerPageChange(parseInt(e.target.value, 10));
    }
  };

  return (
    <div className={classes}>
      <div className={css.filterGroup}>
        <label htmlFor="brandSort" className={css.label}>
          <FormattedMessage id="BrandsPage.sortLabel" />
        </label>
        <select
          id="brandSort"
          value={sortBy}
          onChange={handleSortChange}
          className={css.select}
        >
          <option value="alphabetical">
            {intl.formatMessage({ id: 'BrandsPage.sortAlphabetical' })}
          </option>
          <option value="featured">
            {intl.formatMessage({ id: 'BrandsPage.sortFeatured' })}
          </option>
          <option value="mostProducts">
            {intl.formatMessage({ id: 'BrandsPage.sortMostProducts' })}
          </option>
        </select>
      </div>

      <div className={css.filterGroup}>
        <label htmlFor="brandsPerPage" className={css.label}>
          <FormattedMessage id="BrandsPage.perPageLabel" />
        </label>
        <select
          id="brandsPerPage"
          value={perPage}
          onChange={handlePerPageChange}
          className={css.select}
        >
          <option value="12">
            {intl.formatMessage({ id: 'BrandsPage.perPage12' })}
          </option>
          <option value="24">
            {intl.formatMessage({ id: 'BrandsPage.perPage24' })}
          </option>
          <option value="48">
            {intl.formatMessage({ id: 'BrandsPage.perPage48' })}
          </option>
        </select>
      </div>
    </div>
  );
};


BrandFilterBar.propTypes = {
  sortBy: string,
  onSortChange: func.isRequired,
  perPage: number,
  onPerPageChange: func.isRequired,
  className: string,
};

export default BrandFilterBar;
