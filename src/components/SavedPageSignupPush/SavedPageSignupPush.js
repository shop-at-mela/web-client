import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import NamedLink from '../NamedLink/NamedLink';

import css from './SavedPageSignupPush.module.css';

// Copy-variant lookup for the /saved sign-up push. No A/B/experimentation framework
// exists in this repo — this is a simple constant switch, not a new system.
// See mela-docs/product/prds/add-to-cart-restoration-prd.md §8.
const COPY_VARIANTS = {
  earlyAccess: {
    heading: 'SavedPageSignupPush.earlyAccessHeading',
    body: 'SavedPageSignupPush.earlyAccessBody',
    cta: 'SavedPageSignupPush.earlyAccessCta',
  },
  control: {
    heading: 'SavedPageSignupPush.controlHeading',
    body: 'SavedPageSignupPush.controlBody',
    cta: 'SavedPageSignupPush.controlCta',
  },
};

/**
 * SavedPageSignupPush
 *
 * Static inline sign-up block for anonymous shoppers on /saved. Not a floating
 * auto-dismissing toast (that's SavedItemsBanner) — this one stays put.
 *
 * @param {Object} props
 * @param {"earlyAccess"|"control"} [props.copyVariant="earlyAccess"]
 * @param {string} [props.className]
 */
const SavedPageSignupPush = ({ copyVariant = 'earlyAccess', className }) => {
  const copy = COPY_VARIANTS[copyVariant] || COPY_VARIANTS.earlyAccess;

  return (
    <div className={classNames(css.root, className)}>
      <h2 className={css.heading}>
        <FormattedMessage id={copy.heading} />
      </h2>
      <p className={css.body}>
        <FormattedMessage id={copy.body} />
      </p>
      <NamedLink name="SignupPage" className={css.cta}>
        <FormattedMessage id={copy.cta} />
      </NamedLink>
    </div>
  );
};

export default SavedPageSignupPush;
