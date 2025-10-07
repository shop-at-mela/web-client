import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { isSignupEmailTakenError } from '../../util/errors';
import { pickUserFieldsData, addScopePrefix } from '../../util/userHelpers';

import { login, authenticationInProgress, signup, signupWithIdp } from '../../ducks/auth.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

import {
  Page,
  LayoutSingleColumn,
  NamedRedirect,
  IconSpinner,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

// Import the signup components
import SignupForm from './SignupForm/SignupForm';
import ValueProposition from './ValueProposition/ValueProposition';
import TrustIndicators from './TrustIndicators/TrustIndicators';

import css from './SignupPage.module.css';

const getNonUserFieldParams = (values, userFieldConfigs) => {
  const userFieldKeys = userFieldConfigs.map(({ scope, key }) => addScopePrefix(scope, key));

  return Object.entries(values).reduce((picked, [key, value]) => {
    const isUserFieldKey = userFieldKeys.includes(key);

    return isUserFieldKey
      ? picked
      : {
          ...picked,
          [key]: value,
        };
  }, {});
};

const getAuthInfoFromCookies = () => {
  return Cookies.get('st-authinfo')
    ? JSON.parse(Cookies.get('st-authinfo').replace('j:', ''))
    : null;
};

const getAuthErrorFromCookies = () => {
  return Cookies.get('st-autherror')
    ? JSON.parse(Cookies.get('st-autherror').replace('j:', ''))
    : null;
};

export const SignupPageComponent = props => {
  const [authInfo, setAuthInfo] = useState(getAuthInfoFromCookies());
  const [authError, setAuthError] = useState(getAuthErrorFromCookies());
  const [mounted, setMounted] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);

  const config = useConfiguration();
  const intl = useIntl();

  useEffect(() => {
    // Remove the autherror cookie once the content is saved to state
    if (authError) {
      Cookies.remove('st-autherror');
    }
    setMounted(true);
  }, []);

  // On mobile, it's better to scroll to top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    authInProgress,
    currentUser,
    isAuthenticated,
    location,
    params: pathParams,
    signupError,
    submitSignup,
    scrollingDisabled,
  } = props;

  // Get user type from URL params or state, default to 'customer'
  const userTypeInPushState = location.state?.userType || null;
  const userType = pathParams?.userType || userTypeInPushState || selectedUserType || 'customer';

  const { userFields, userTypes = [] } = config.user;
  const preselectedUserType = userTypes.find(conf => conf.userType === userType)?.userType || null;

  const user = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!user.id;

  // Check if user should be redirected
  const locationFrom = location.state?.from || null;
  const authinfoFrom = authInfo?.from || null;
  const from = locationFrom || authinfoFrom || null;

  const shouldRedirectToFrom = isAuthenticated && from;
  const shouldRedirectToLandingPage = isAuthenticated && currentUserLoaded;

  if (shouldRedirectToFrom) {
    return <Redirect to={from} />;
  } else if (shouldRedirectToLandingPage) {
    return <NamedRedirect name="LandingPage" />;
  }

  const handleSignup = values => {
    const { userType, email, password, fname, lname, displayName, ...rest } = values;
    const displayNameMaybe = displayName ? { displayName: displayName.trim() } : {};

    const params = {
      email,
      password,
      firstName: fname.trim(),
      lastName: lname.trim(),
      ...displayNameMaybe,
      publicData: {
        userType,
        ...pickUserFieldsData(rest, 'public', userType, userFields),
      },
      privateData: {
        ...pickUserFieldsData(rest, 'private', userType, userFields),
      },
      protectedData: {
        ...pickUserFieldsData(rest, 'protected', userType, userFields),
        ...getNonUserFieldParams(rest, userFields),
      },
    };

    submitSignup(params);
  };

  const signupErrorMessage = signupError ? (
    <div className={css.error}>
      {isSignupEmailTakenError(signupError) ? (
        <FormattedMessage id="SignupPage.signupFailedEmailAlreadyTaken" />
      ) : (
        <FormattedMessage id="SignupPage.signupFailed" />
      )}
    </div>
  ) : null;

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'SignupPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'SignupPage.schemaDescription' },
    { marketplaceName }
  );

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        mainColumnClassName={css.layoutWrapperMain}
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <section className={css.root}>
          <div className={css.contentContainer}>
            <div className={css.content}>
            {/* Back to Customer navigation for provider mode */}
            {userType === 'provider' && (
              <div className={css.backNavigation}>
                <button
                  className={css.backButton}
                  onClick={() => {
                    window.location.href = '/signup';
                  }}
                >
                  ← Back to Customer Signup
                </button>
              </div>
            )}

            {/* Value Proposition */}
            <ValueProposition userType={userType} />

            {/* Signup Form */}
            <div className={css.formSection}>
              {signupErrorMessage}

              <SignupForm
                onSubmit={handleSignup}
                inProgress={authInProgress}
                userType={userType}
                userTypes={userTypes}
                userFields={userFields}
                preselectedUserType={preselectedUserType}
              />
            </div>

            {/* Trust Indicators */}
            <TrustIndicators userType={userType} />

            {/* Login Link */}
            <div className={css.loginSection}>
              <span className={css.loginText}>
                <FormattedMessage id="SignupPage.alreadyHaveAccount" />
              </span>
              <button
                className={css.loginLink}
                onClick={() => {
                  // Navigate to login page
                  window.location.href = '/login';
                }}
              >
                <FormattedMessage id="SignupPage.loginLinkText" />
              </button>
            </div>

            {/* Provider CTA - only show for customer mode */}
            {userType === 'customer' && (
              <div className={css.providerCta}>
                <h3 className={css.providerCtaTitle}>
                  <FormattedMessage id="ProviderCTA.title" />
                </h3>
                <p className={css.providerCtaDescription}>
                  <FormattedMessage id="ProviderCTA.description" />
                </p>
                <button
                  className={css.providerCtaButton}
                  onClick={() => {
                    window.location.href = '/signup/provider';
                  }}
                >
                  <FormattedMessage id="ProviderCTA.buttonText" />
                </button>
              </div>
            )}
            </div>
          </div>
        </section>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { isAuthenticated, signupError } = state.auth;
  const { currentUser } = state.user;

  return {
    authInProgress: authenticationInProgress(state),
    currentUser,
    isAuthenticated,
    scrollingDisabled: isScrollingDisabled(state),
    signupError,
  };
};

const mapDispatchToProps = dispatch => ({
  submitSignup: params => dispatch(signup(params)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const SignupPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SignupPageComponent);

export default SignupPage;