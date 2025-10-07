import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import css from './TrustIndicators.module.css';

const TrustIndicators = () => {
  return (
    <div className={css.container}>
      <div className={css.indicators}>
        <div className={css.indicator}>
          <span className={css.icon}>🔒</span>
          <span className={css.text}>
            <FormattedMessage id="TrustIndicators.secure" />
          </span>
        </div>
        <div className={css.indicator}>
          <span className={css.icon}>⚡</span>
          <span className={css.text}>
            <FormattedMessage id="TrustIndicators.instant" />
          </span>
        </div>
        <div className={css.indicator}>
          <span className={css.icon}>✓</span>
          <span className={css.text}>
            <FormattedMessage id="TrustIndicators.verified" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustIndicators;