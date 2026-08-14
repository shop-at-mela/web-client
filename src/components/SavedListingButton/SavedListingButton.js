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
 * Three display variants:
 *   "icon"   — compact heart icon for overlay on cards / gallery
 *   "button" — full labelled button for the ListingPage action area
 *   "cta"    — primary-styled "Add to Cart" button for the PDP order forms
 *              (see mela-docs/product/prds/add-to-cart-restoration-prd.md §6)
 *
 * @param {Object} props
 * @param {string} props.listingId UUID string of the listing
 * @param {Object} [props.listingData] { title, imageUrl } for anon localStorage save
 * @param {"icon"|"button"|"cta"} [props.variant="icon"]
 * @param {"add_to_cart_button"|"heart_icon"} [props.source="heart_icon"] tags the saved_listing_toggle analytics event
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * @param {Function} [props.onAdded] called synchronously when a click transitions the listing
 *   from unsaved to saved — used by the PDP CTA call sites to trigger the inline
 *   "✓ Added · View Saved" confirmation (add-to-cart-restoration-prd.md §12.2 fix #4)
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
    source = 'heart_icon',
    className,
    rootClassName,
    isSaved,
    inProgress,
    isAuthenticated,
    savedCount,
    onToggle,
    onAdded,
  } = props;

  const intl = useIntl();
  const isCta = variant === 'cta';
  const isIcon = variant === 'icon';
  const capReached = isAuthenticated && !isSaved && savedCount >= MAX_SAVED;

  const ariaLabel = isCta
    ? intl.formatMessage({ id: isSaved ? 'SavedListingButton.addedToCart' : 'SavedListingButton.addToCart' })
    : isSaved
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
    const wasSaved = isSaved;
    onToggle(listingId, listingData, source);
    // The optimistic update inside onToggle is synchronous, so isSaved has already
    // flipped by the time this runs — no need to await the network round-trip.
    if (!wasSaved && typeof onAdded === 'function') {
      onAdded();
    }
  };

  const classes = classNames(
    rootClassName || (isIcon ? css.iconRoot : isCta ? css.ctaRoot : css.buttonRoot),
    className,
    {
      [css.saved]: isSaved,
      [css.inProgress]: inProgress,
    }
  );

  // cta cap-reached renders disabled + tooltip rather than a silent no-op click
  // (PRD acceptance criteria — icon/button variants keep their existing no-op behavior).
  const disabled = inProgress || (isCta && capReached);

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isSaved}
      title={title}
      disabled={disabled}
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
      ) : isCta ? (
        <span className={css.buttonContent}>
          {isSaved
            ? intl.formatMessage({ id: 'SavedListingButton.addedToCart' })
            : intl.formatMessage({ id: 'SavedListingButton.addToCart' })}
        </span>
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
  onToggle: (listingId, listingData, source) =>
    dispatch(toggleSaveListing(listingId, listingData, source)),
});

const SavedListingButton = connect(mapStateToProps, mapDispatchToProps)(SavedListingButtonComponent);

export default SavedListingButton;
