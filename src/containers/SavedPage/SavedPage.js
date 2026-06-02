import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { useIntl, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import {
  selectSavedListingIds,
  fetchSavedListings,
} from '../../ducks/savedListings.duck';

import { Page, NamedLink, ListingCard } from '../../components';
import css from './SavedPage.module.css';

/**
 * SavedPage — /saved
 *
 * Client-side only (no SSR loadData). Listings are fetched lazily after paint
 * using the savedListingIds already loaded by fetchCurrentUser.
 */
const SavedPageComponent = props => {
  const { savedListingIds, savedListings, fetchInProgress, fetchError, onFetchSavedListings } =
    props;

  const intl = useIntl();
  const config = useConfiguration();

  useEffect(() => {
    if (savedListingIds.length > 0) {
      onFetchSavedListings(savedListingIds);
    }
  }, [savedListingIds.join(',')]); // stable string key — avoids re-fetch on same IDs

  const schemaTitle = intl.formatMessage({ id: 'SavedPage.schemaTitle' });
  const schemaDescription = intl.formatMessage({ id: 'SavedPage.schemaDescription' });

  const isEmpty = savedListingIds.length === 0;
  const hasListings = savedListings.length > 0;

  const renderSizes = '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw';

  return (
    <Page title={schemaTitle} description={schemaDescription} scrollingDisabled={false}>
      <div className={css.root}>
        <div className={css.header}>
          <h1 className={css.title}>
            <FormattedMessage id="SavedPage.title" />
          </h1>
          <p className={css.subheading}>
            <FormattedMessage id="SavedPage.subheading" />
          </p>
        </div>

        {fetchError && (
          <div className={css.error}>
            <FormattedMessage id="SavedPage.error" />
          </div>
        )}

        {fetchInProgress && !hasListings && (
          <div className={css.loading}>
            <FormattedMessage id="SavedPage.loading" />
          </div>
        )}

        {!fetchInProgress && isEmpty && (
          <div className={css.emptyState}>
            <h2 className={css.emptyHeading}>
              <FormattedMessage id="SavedPage.emptyHeading" />
            </h2>
            <p className={css.emptySubheading}>
              <FormattedMessage id="SavedPage.emptySubheading" />
            </p>
            <NamedLink name="SearchPage" className={css.browseCta}>
              <FormattedMessage id="SavedPage.emptyBrowseCta" />
            </NamedLink>
          </div>
        )}

        {hasListings && (
          <div className={css.grid}>
            {savedListings.map(listing => (
              <ListingCard
                key={listing.id.uuid}
                listing={listing}
                renderSizes={renderSizes}
                showAuthorInfo
                showTrustBadges
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
};

const mapStateToProps = state => {
  const savedListingIds = selectSavedListingIds(state);
  const savedListings = getListingsById(state, savedListingIds.map(id => ({ uuid: id })));
  return {
    savedListingIds,
    savedListings,
    fetchInProgress: state.savedListings.fetchInProgress,
    fetchError: state.savedListings.fetchError,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchSavedListings: ids => dispatch(fetchSavedListings(ids)),
});

const SavedPage = compose(connect(mapStateToProps, mapDispatchToProps))(SavedPageComponent);

export default SavedPage;
