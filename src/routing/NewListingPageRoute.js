import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { NamedRedirect } from '../components';
import BrandPartnershipPage from '../containers/BrandPartnershipPage/BrandPartnershipPage';

const draftId = '00000000-0000-0000-0000-000000000000';
const draftSlug = 'draft';

const NewListingPageRouteComponent = ({ currentUser, ...props }) => {
  // Check if user is logged in and is a provider
  const isLoggedInProvider = currentUser?.id && currentUser?.attributes?.profile?.publicData?.userType === 'provider';

  if (isLoggedInProvider) {
    // For logged-in providers, redirect to EditListingPage as before
    return (
      <NamedRedirect
        name="EditListingPage"
        params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }}
      />
    );
  }

  // For all other scenarios, show BrandPartnershipPage
  return <BrandPartnershipPage {...props} />;
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return {
    currentUser,
  };
};

const NewListingPageRoute = compose(
  connect(mapStateToProps)
)(NewListingPageRouteComponent);

export default NewListingPageRoute;