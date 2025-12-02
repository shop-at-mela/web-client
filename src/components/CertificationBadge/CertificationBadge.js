import React from 'react';
import { string, number, oneOf } from 'prop-types';
import classNames from 'classnames';

import { getCertificationInfo } from './certificationIcons';
import css from './CertificationBadge.module.css';

/**
 * CertificationBadge - Reusable certification display component
 * Can be used across all pages: BrandCard, ProfilePage, ListingPage, etc.
 *
 * @param {Object} props
 * @param {string} props.certification - Certification type (e.g., 'gots_certified')
 * @param {string} props.variant - Display variant: 'default', 'compact', 'icon-only'
 * @param {number} props.size - Icon size in pixels (default: 16)
 * @param {boolean} props.showTooltip - Show description tooltip on hover
 * @param {string} props.className - Additional CSS class
 */
const CertificationBadge = props => {
  const {
    certification,
    variant = 'default',
    size = 16,
    showTooltip = true,
    className = null,
  } = props;

  const certInfo = getCertificationInfo(certification);
  const { icon: IconComponent, label, description, color } = certInfo;

  const classes = classNames(
    css.root,
    css[variant],
    showTooltip && css.hasTooltip,
    className
  );

  return (
    <div className={classes} data-certification={certification}>
      <IconComponent size={size} className={css.icon} />

      {variant !== 'icon-only' && (
        <span className={css.label}>{label}</span>
      )}

      {showTooltip && (
        <div className={css.tooltip}>
          <div className={css.tooltipContent}>
            <strong>{label}</strong>
            <p>{description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

CertificationBadge.propTypes = {
  certification: string.isRequired,
  variant: oneOf(['default', 'compact', 'icon-only']),
  size: number,
  showTooltip: string,
  className: string,
};

export default CertificationBadge;
