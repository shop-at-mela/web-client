import React from 'react';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { H1 } from '../../../components';
import css from './UserTypeSelector.module.css';

const UserTypeSelector = ({ userTypes, selectedUserType, onUserTypeChange, preselectedUserType }) => {
  const intl = useIntl();

  // Always show selector to allow switching between customer and provider
  // If no userTypes provided, use default customer/provider options
  const defaultUserTypes = [
    { userType: 'customer', label: intl.formatMessage({ id: 'UserTypeSelector.customer.label' }) },
    { userType: 'provider', label: intl.formatMessage({ id: 'UserTypeSelector.provider.label' }) }
  ];

  const availableUserTypes = userTypes && userTypes.length > 0 ? userTypes : defaultUserTypes;

  const handleUserTypeSelect = (userType) => {
    onUserTypeChange(userType);
  };

  return (
    <div className={css.container}>
      <H1 className={css.title}>
        <FormattedMessage id="UserTypeSelector.title" />
      </H1>

      <p className={css.subtitle}>
        <FormattedMessage id="UserTypeSelector.subtitle" />
      </p>

      <div className={css.options}>
        {availableUserTypes.map((config) => {
          const { userType, label } = config;
          const isSelected = selectedUserType === userType;

          // Get user type specific messaging
          const getIcon = (type) => {
            switch (type) {
              case 'customer':
                return '🛍️';
              case 'provider':
                return '🏪';
              default:
                return '👤';
            }
          };

          const getDescription = (type) => {
            switch (type) {
              case 'customer':
                return intl.formatMessage({ id: 'UserTypeSelector.customer.description' });
              case 'provider':
                return intl.formatMessage({ id: 'UserTypeSelector.provider.description' });
              default:
                return '';
            }
          };

          return (
            <button
              key={userType}
              className={`${css.option} ${isSelected ? css.optionSelected : ''}`}
              onClick={() => handleUserTypeSelect(userType)}
              type="button"
            >
              <div className={css.optionIcon}>
                {getIcon(userType)}
              </div>
              <div className={css.optionContent}>
                <div className={css.optionLabel}>
                  {label}
                </div>
                <div className={css.optionDescription}>
                  {getDescription(userType)}
                </div>
              </div>
              {isSelected && (
                <div className={css.checkmark}>
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UserTypeSelector;