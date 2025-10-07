import React from 'react';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { H2 } from '../../../components';
import css from './ValueProposition.module.css';

const ValueProposition = ({ userType }) => {
  const intl = useIntl();

  // Default messaging when no user type is selected
  if (!userType) {
    return (
      <div className={css.container}>
        <H2 className={css.title}>
          <FormattedMessage id="ValueProposition.default.title" />
        </H2>
        <p className={css.subtitle}>
          <FormattedMessage id="ValueProposition.default.subtitle" />
        </p>
      </div>
    );
  }

  // Customer-specific messaging
  if (userType === 'customer') {
    return (
      <div className={css.container}>
        <H2 className={css.title}>
          <FormattedMessage id="ValueProposition.customer.title" />
        </H2>
        <p className={css.subtitle}>
          <FormattedMessage id="ValueProposition.customer.subtitle" />
        </p>

        <div className={css.valuePoints}>
          <div className={css.valuePoint}>
            <span className={css.icon}>❤️</span>
            <span className={css.text}>
              <FormattedMessage id="ValueProposition.customer.point1" />
            </span>
          </div>
          <div className={css.valuePoint}>
            <span className={css.icon}>📋</span>
            <span className={css.text}>
              <FormattedMessage id="ValueProposition.customer.point2" />
            </span>
          </div>
          <div className={css.valuePoint}>
            <span className={css.icon}>🔍</span>
            <span className={css.text}>
              <FormattedMessage id="ValueProposition.customer.point3" />
            </span>
          </div>
        </div>

        <div className={css.socialProof}>
          <span className={css.proofText}>
            <FormattedMessage
              id="ValueProposition.customer.socialProof"
              values={{
                count: <strong>50,000+</strong>
              }}
            />
          </span>
        </div>
      </div>
    );
  }

  // Provider-specific messaging
  if (userType === 'provider') {
    return (
      <div className={css.container}>
        <H2 className={css.title}>
          <FormattedMessage id="ValueProposition.provider.title" />
        </H2>
        <p className={css.subtitle}>
          <FormattedMessage id="ValueProposition.provider.subtitle" />
        </p>

        <div className={css.valuePoints}>
          <div className={css.valuePoint}>
            <span className={css.icon}>💰</span>
            <span className={css.text}>
              <FormattedMessage id="ValueProposition.provider.point1" />
            </span>
          </div>
          <div className={css.valuePoint}>
            <span className={css.icon}>🇺🇸</span>
            <span className={css.text}>
              <FormattedMessage id="ValueProposition.provider.point2" />
            </span>
          </div>
          <div className={css.valuePoint}>
            <span className={css.icon}>📈</span>
            <span className={css.text}>
              <FormattedMessage id="ValueProposition.provider.point3" />
            </span>
          </div>
        </div>

        <div className={css.socialProof}>
          <span className={css.proofText}>
            <FormattedMessage
              id="ValueProposition.provider.socialProof"
              values={{
                count: <strong>200+</strong>,
                growth: <strong>300%</strong>
              }}
            />
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default ValueProposition;