/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';

import {
  AvatarLarge,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
} from '../../../../components';

import css from './TopbarMobileMenu.module.css';

const CustomLinkComponent = ({ linkConfig, currentPage }) => {
  const { group, text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;

    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  // Note: if the config contains 'route' keyword,
  // then in-app linking config has been resolved already.
  if (type === 'internal' && route) {
    // Internal link
    const { name, params, to } = route || {};
    const className = classNames(css.navigationLink, getCurrentPageClass(name));
    return (
      <NamedLink name={name} params={params} to={to} className={className}>
        <span className={css.menuItemBorder} />
        {text}
      </NamedLink>
    );
  }
  return (
    <ExternalLink href={href} className={css.navigationLink}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

/**
 * Menu for mobile layout (opens through hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated
 * @param {string?} props.currentPage
 * @param {boolean} props.currentUserHasListings
 * @param {Object?} props.currentUser API entity
 * @param {number} props.notificationCount
 * @param {Array<Object>} props.customLinks Contains object like { group, text, type, href, route }
 * @param {Function} props.onLogout
 * @returns {JSX.Element} search icon
 */
const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    inboxTab,
    currentUser,
    notificationCount = 0,
    customLinks,
    onLogout,
    showCreateListingsLink,
  } = props;

  const user = ensureCurrentUser(currentUser);

  const extraLinks = customLinks.map((linkConfig, index) => {
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  });

  const createListingsLinkMaybe = showCreateListingsLink ? (
    <NamedLink className={css.createNewListingLink} name="NewListingPage">
      <FormattedMessage
        id={isAuthenticated ? "TopbarMobileMenu.newListingLink" : "TopbarMobileMenu.startSelling"}
      />
    </NamedLink>
  ) : null;

  if (!isAuthenticated) {
    return (
      <nav className={css.root}>
        <div className={css.content}>
          {/* Hero Section */}
          <div className={css.heroSection}>
            <h1 className={css.heroTitle}>
              <FormattedMessage id="TopbarMobileMenu.heroTitle" />
            </h1>
            <p className={css.heroSubtitle}>
              <FormattedMessage id="TopbarMobileMenu.heroSubtitle" />
            </p>
          </div>

          {/* Authentication Section - Simple */}
          <div className={css.authenticationSection}>
            <NamedLink name="SignupPage" className={css.signupButton}>
              <FormattedMessage id="TopbarMobileMenu.createAccount" />
            </NamedLink>
            <div className={css.loginWrapper}>
              <span className={css.alreadyMember}>
                <FormattedMessage id="TopbarMobileMenu.alreadyMember" />
              </span>{' '}
              <NamedLink name="LoginPage" className={css.loginLink}>
                <FormattedMessage id="TopbarMobileMenu.loginLink" />
              </NamedLink>
            </div>
          </div>

          {/* Navigation Section - Baby Focused */}
          <div className={css.sectionHeader}>
            <FormattedMessage id="TopbarMobileMenu.browseHeader" />
          </div>
          <div className={css.navigationSection}>
            <NamedLink
              name="SearchPage"
              to={{ search: '?pub_categoryLevel1=Baby-Clothes-Accessories' }}
              className={css.navigationLink}
            >
              <span className={css.navigationLinkContent}>
                <FormattedMessage id="TopbarMobileMenu.forLittleOnes" />
                <span className={css.navigationArrow}>→</span>
              </span>
            </NamedLink>
            <NamedLink name="BrandsPage" className={css.navigationLink}>
              <span className={css.navigationLinkContent}>
                <FormattedMessage id="TopbarMobileMenu.organicBrands" />
                <span className={css.navigationArrow}>→</span>
              </span>
            </NamedLink>
          </div>

          {/* Featured Brands Section */}
          <div className={css.featuredBrandsSection}>
            <div className={css.sectionHeader}>
              <FormattedMessage id="TopbarMobileMenu.featuredBrands" />
            </div>
            <div className={css.brandLogos}>
              <div className={css.brandLogo}></div>
              <div className={css.brandLogo}></div>
              <div className={css.brandLogo}></div>
              <div className={css.brandLogo}></div>
              <div className={css.brandLogo}></div>
              <div className={css.brandLogo}></div>
            </div>
            <p className={css.featuredBrandsTagline}>
              <FormattedMessage id="TopbarMobileMenu.featuredBrandsTagline" />
            </p>
          </div>

          {/* Custom Links */}
          {extraLinks && extraLinks.length > 0 ? (
            <>
              <div className={css.sectionHeader}>
                <FormattedMessage id="TopbarMobileMenu.moreHeader" />
              </div>
              <div className={css.customLinksWrapper}>{extraLinks}</div>
            </>
          ) : null}

          <div className={css.spacer} />
        </div>
        <div className={css.footer}>
          <div className={css.footerContent}>
            <div className={css.footerHeader}>SELL ON MELA</div>
            <p className={css.footerTagline}>
              <FormattedMessage id="TopbarMobileMenu.sellerCTA" />
            </p>
            <NamedLink className={css.createNewListingLink} name="NewListingPage">
              <FormattedMessage id="TopbarMobileMenu.startSelling" />
            </NamedLink>
          </div>
        </div>
      </nav>
    );
  }

  const notificationCountBadge =
    notificationCount > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={notificationCount} />
    ) : null;

  const displayName = user.attributes.profile.firstName;
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = currentPage?.indexOf('InboxPage') === 0 && page?.indexOf('InboxPage') === 0;
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };

  const manageListingsLinkMaybe = showCreateListingsLink ? (
    <NamedLink
      className={classNames(css.navigationLink, currentPageClass('ManageListingsPage'))}
      name="ManageListingsPage"
    >
      <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
    </NamedLink>
  ) : null;

  return (
    <div className={css.root}>
      <AvatarLarge className={css.avatar} user={currentUser} />
      <div className={css.content}>
        <span className={css.greeting}>
          <FormattedMessage id="TopbarMobileMenu.greeting" values={{ displayName }} />
        </span>
        <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
          <FormattedMessage id="TopbarMobileMenu.logoutLink" />
        </InlineTextButton>

        <div className={css.accountLinksWrapper}>
          <NamedLink
            className={classNames(css.inbox, currentPageClass(`InboxPage:${inboxTab}`))}
            name="InboxPage"
            params={{ tab: inboxTab }}
          >
            <FormattedMessage id="TopbarMobileMenu.inboxLink" />
            {notificationCountBadge}
          </NamedLink>
          {manageListingsLinkMaybe}
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
          </NamedLink>
        </div>
        <div className={css.customLinksWrapper}>{extraLinks}</div>
        <div className={css.spacer} />
      </div>
      <div className={css.footer}>{createListingsLinkMaybe}</div>
    </div>
  );
};

export default TopbarMobileMenu;
