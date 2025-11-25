import React from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { IconClose } from '../../../components';
import css from './ActiveFiltersBar.module.css';

/**
 * ActiveFiltersBar - displays active filters as removable chips
 * Sticky bar that shows selected filters with ability to remove individual filters
 *
 * @param {Object} props
 * @param {Object} props.activeFilters - Object with active filter key-value pairs
 * @param {Array} props.filterConfigs - Array of filter configuration objects
 * @param {Function} props.onRemoveFilter - Callback when filter is removed
 * @param {Function} props.onClearAll - Callback to clear all filters
 * @param {string} props.className - Additional CSS classes
 */
const ActiveFiltersBar = props => {
  const intl = useIntl();
  const { activeFilters, filterConfigs, onRemoveFilter, onClearAll, className } = props;

  // Filter out non-filter params (page, mapSearch, etc.) and category filters
  // Categories are already visible in sidebar/breadcrumbs, no need to show here
  const filterKeys = Object.keys(activeFilters).filter(key =>
    !['page', 'mapSearch', 'bounds', 'origin', 'address',
      'pub_categoryLevel1', 'pub_categoryLevel2', 'pub_categoryLevel3'].includes(key)
  );

  if (filterKeys.length === 0) {
    return null;
  }

  // Get human-readable label for filter
  const getFilterLabel = (key, value) => {
    const config = filterConfigs.find(f => {
      const configKey = f.scope === 'public' ? `pub_${f.key}` : f.key;
      return configKey === key || key.startsWith(configKey);
    });

    if (!config) return null;

    // Handle category filters (pub_categoryLevel1, pub_categoryLevel2, etc.)
    if (key.includes('categoryLevel')) {
      return {
        label: config.filterConfig?.label || 'Category',
        value: value,
        displayValue: value.replace(/-/g, ' '),
      };
    }

    // Handle price filter
    if (key === 'price') {
      const [min, max] = value.split(',');
      return {
        label: 'Price',
        value: value,
        displayValue: `$${min} - $${max}`,
      };
    }

    // Handle enum filters with multiple values (has_any: or has_all:)
    if (typeof value === 'string' && (value.startsWith('has_any:') || value.startsWith('has_all:'))) {
      const prefix = value.startsWith('has_any:') ? 'has_any:' : 'has_all:';
      const values = value.replace(prefix, '').split(',');

      if (config.enumOptions) {
        const labels = values.map(v => {
          const option = config.enumOptions.find(o => o.option === v);
          return option?.label || v;
        });

        return {
          label: config.filterConfig?.label || config.key,
          value: value,
          displayValue: labels.join(', '),
        };
      }
    }

    // Handle simple enum filters
    if (config.enumOptions) {
      const option = config.enumOptions.find(o => o.option === value);
      return {
        label: config.filterConfig?.label || config.key,
        value: value,
        displayValue: option?.label || value,
      };
    }

    return {
      label: config.filterConfig?.label || config.key,
      value: value,
      displayValue: value,
    };
  };

  const classes = classNames(css.root, className);

  return (
    <div className={classes}>
      <div className={css.filtersContainer}>
        {filterKeys.map(key => {
          const filterInfo = getFilterLabel(key, activeFilters[key]);
          if (!filterInfo) return null;

          return (
            <button
              key={key}
              className={css.filterChip}
              onClick={() => onRemoveFilter(key)}
              title={intl.formatMessage({ id: 'ActiveFiltersBar.removeFilter' })}
            >
              <span className={css.filterValue}>{filterInfo.displayValue}</span>
              <IconClose rootClassName={css.closeIcon} size="small" />
            </button>
          );
        })}

        {filterKeys.length > 1 && (
          <button className={css.clearAllButton} onClick={onClearAll}>
            <FormattedMessage id="ActiveFiltersBar.clearAll" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveFiltersBar;
