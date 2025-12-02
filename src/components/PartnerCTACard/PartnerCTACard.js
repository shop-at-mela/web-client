import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { ExternalLink } from '../../components';

import css from './PartnerCTACard.module.css';

/**
 * PartnerCTACard - B2B partnership invitation card
 * Styled to match BrandCardHome for visual consistency
 *
 * @param {Object} props
 * @param {string} props.className - Additional CSS class
 * @param {string} props.rootClassName - Root CSS class override
 * @param {string} props.partnerUrl - URL to partner application page
 */
const PartnerCTACard = props => {
  const {
    className = null,
    rootClassName = null,
    partnerUrl = '/partner', // Default fallback
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={css.content}>
        {/* Icon */}
        <div className={css.icon}>🤝</div>

        {/* Title */}
        <h3 className={css.title}>
          <FormattedMessage id="PartnerCTACard.title" />
        </h3>

        {/* Description */}
        <p className={css.description}>
          <FormattedMessage id="PartnerCTACard.description" />
        </p>

        {/* CTA Button */}
        <ExternalLink href={partnerUrl} className={css.ctaButton}>
          <FormattedMessage id="PartnerCTACard.cta" />
          <span className={css.ctaArrow}>→</span>
        </ExternalLink>
      </div>
    </div>
  );
};

PartnerCTACard.propTypes = {
  className: string,
  rootClassName: string,
  partnerUrl: string,
};

export default PartnerCTACard;
