import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import {
  selectIsListingSaved,
  selectToggleInProgress,
  toggleSaveListing,
  selectSavedListingIds,
} from '../../ducks/savedListings.duck';

import css from './SavedListingButton.module.css';

const MAX_SAVED = 200;

/**
 * SavedListingButton
 *
 * Connected component — reads its own saved state from Redux so it doesn't
 * require prop drilling through card-rendering parents.
 *
 * Two display variants:
 *   "icon"  — compact heart icon for overlay on cards / gallery
 *   "button" — full labelled button for the ListingPage action area
 *
 * @param {Object} props
 * @param {string} props.listingId UUID string of the listing
 * @param {Object} [props.listingData] { title, imageUrl } for anon localStorage save
 * @param {"icon"|"button"} [props.variant="icon"]
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * -- injected by connect --
 * @param {boolean} props.isSaved
 * @param {boolean} props.inProgress
 * @param {boolean} props.isAuthenticated
 * @param {number} props.savedCount
 * @param {Function} props.onToggle
 */
const SavedListingButtonComponent = props => {
  const {
    listingId,
    listingData,
    variant = 'icon',
    className,
    rootClassName,
    isSaved,
    inProgress,
    isAuthenticated,
    savedCount,
    onToggle,
  } = props;

  const intl = useIntl();
  const capReached = isAuthenticated && !isSaved && savedCount >= MAX_SAVED;

  const ariaLabel = isSaved
    ? intl.formatMessage({ id: 'SavedListingButton.savedAriaLabel' })
    : intl.formatMessage({ id: 'SavedListingButton.saveAriaLabel' });

  const title = capReached
    ? intl.formatMessage({ id: 'SavedListingButton.capReached' })
    : undefined;

  const handleClick = e => {
    // Prevent the parent NamedLink from navigating when button is clicked
    e.preventDefault();
    e.stopPropagation();
    if (inProgress || capReached) return;
    onToggle(listingId, listingData);
  };

  const isIcon = variant === 'icon';

  const classes = classNames(
    rootClassName || (isIcon ? css.iconRoot : css.buttonRoot),
    className,
    {
      [css.saved]: isSaved,
      [css.inProgress]: inProgress,
    }
  );

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isSaved}
      title={title}
      disabled={inProgress}
    >
      {isIcon ? (
        <svg
          className={css.heartIcon}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      ) : (
        <span className={css.buttonContent}>
          <svg
            className={css.heartIconInline}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
          <span>
            {isSaved
              ? intl.formatMessage({ id: 'SavedListingButton.saved' })
              : intl.formatMessage({ id: 'SavedListingButton.save' })}
          </span>
        </span>
      )}
    </button>
  );
};

const mapStateToProps = (state, ownProps) => ({
  isSaved: selectIsListingSaved(state, ownProps.listingId),
  inProgress: selectToggleInProgress(state, ownProps.listingId),
  isAuthenticated: state.auth.isAuthenticated,
  savedCount: selectSavedListingIds(state).length,
});

const mapDispatchToProps = dispatch => ({
  onToggle: (listingId, listingData) => dispatch(toggleSaveListing(listingId, listingData)),
});

const SavedListingButton = connect(mapStateToProps, mapDispatchToProps)(SavedListingButtonComponent);

export default SavedListingButton;
