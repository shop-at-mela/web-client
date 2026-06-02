import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { FormattedMessage } from '../../../../util/reactIntl';
import { getListingsById } from '../../../../ducks/marketplaceData.duck';
import {
  selectSavedListingIds,
  fetchSavedListings,
} from '../../../../ducks/savedListings.duck';

import { NamedLink, ListingCard } from '../../../../components';
import css from './SavedItemsModule.module.css';

const MAX_PREVIEW = 4;

/**
 * SavedItemsModule
 *
 * Shows up to 4 saved listings on the homepage (authenticated users only).
 * Fetches listing entities lazily after paint — zero impact on initial page load.
 * Hidden entirely when the user has no saved items.
 */
const SavedItemsModuleComponent = props => {
  const {
    isAuthenticated,
    savedListingIds,
    savedListings,
    onFetchSavedListings,
  } = props;

  useEffect(() => {
    if (isAuthenticated && savedListingIds.length > 0) {
      onFetchSavedListings(savedListingIds.slice(0, MAX_PREVIEW));
    }
  }, [isAuthenticated, savedListingIds.slice(0, MAX_PREVIEW).join(',')]); // stable string key — avoids re-fetch on same IDs

  // Only render for authenticated users with at least one saved item
  if (!isAuthenticated || savedListingIds.length === 0) {
    return null;
  }

  // Wait until at least one entity has been loaded before showing the section
  if (savedListings.length === 0) {
    return null;
  }

  const previewListings = savedListings.slice(0, MAX_PREVIEW);
  const hasMore = savedListingIds.length > MAX_PREVIEW;
  const renderSizes = '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw';

  return (
    <div className={css.root}>
      <div className={css.header}>
        <div className={css.titleGroup}>
          <h2 className={css.heading}>
            <FormattedMessage id="SavedItemsModule.heading" />
          </h2>
          <span className={css.subheading}>
            <FormattedMessage id="SavedItemsModule.subheading" />
          </span>
        </div>
        {hasMore && (
          <NamedLink name="SavedPage" className={css.seeAllLink}>
            <FormattedMessage id="SavedItemsModule.seeAll" />
          </NamedLink>
        )}
      </div>
      <div className={css.grid}>
        {previewListings.map(listing => (
          <ListingCard
            key={listing.id.uuid}
            listing={listing}
            renderSizes={renderSizes}
            showAuthorInfo
          />
        ))}
      </div>
      {hasMore && (
        <div className={css.seeAllMobile}>
          <NamedLink name="SavedPage" className={css.seeAllLinkMobile}>
            <FormattedMessage id="SavedItemsModule.seeAll" />
          </NamedLink>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = state => {
  const savedListingIds = selectSavedListingIds(state);
  const previewIds = savedListingIds.slice(0, MAX_PREVIEW);
  const savedListings = getListingsById(state, previewIds.map(id => ({ uuid: id })));
  return {
    isAuthenticated: state.auth.isAuthenticated,
    savedListingIds,
    savedListings,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchSavedListings: ids => dispatch(fetchSavedListings(ids)),
});

const SavedItemsModule = connect(mapStateToProps, mapDispatchToProps)(SavedItemsModuleComponent);

export default SavedItemsModule;
