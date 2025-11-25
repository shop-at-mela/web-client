import React from 'react';
import classNames from 'classnames';
import { useIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../util/search';
import { IconClose, IconSearch } from '../../../components';
import css from './SearchQueryBar.module.css';

/**
 * SearchQueryBar - Shows current search query with edit and clear actions
 * Only visible on mobile search results page
 *
 * @param {Object} props
 * @param {string} props.keywords - Search keywords (if keyword search)
 * @param {string} props.address - Search location (if location search)
 * @param {Function} props.onEdit - Callback to open search modal for editing
 * @param {Function} props.onClear - Callback to clear search query
 * @param {Object} props.config - App configuration
 * @param {string} props.className - Additional CSS classes
 */
const SearchQueryBar = props => {
  const intl = useIntl();
  const { keywords, address, onEdit, onClear, config, className } = props;

  const isKeywordSearch = isMainSearchTypeKeywords(config);
  const queryText = isKeywordSearch ? keywords : address;

  // Don't render if no query
  if (!queryText) return null;

  const classes = classNames(css.root, className);

  return (
    <div className={classes}>
      <button
        className={css.queryButton}
        onClick={onEdit}
        aria-label={intl.formatMessage(
          { id: 'SearchQueryBar.editSearchAriaLabel' },
          { query: queryText }
        )}
      >
        <IconSearch className={css.searchIcon} />
        <span className={css.queryText}>{queryText}</span>
      </button>

      <button
        className={css.clearButton}
        onClick={onClear}
        aria-label={intl.formatMessage({ id: 'SearchQueryBar.clearSearch' })}
      >
        <IconClose size="small" />
      </button>
    </div>
  );
};

export default SearchQueryBar;
