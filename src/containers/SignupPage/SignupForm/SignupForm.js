import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';

import { Form, PrimaryButton, FieldTextInput, CustomExtendedDataField } from '../../../components';

import css from './SignupForm.module.css';

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    initialValues={{ userType: props.preselectedUserType || props.userType || getSoleUserTypeMaybe(props.userTypes) }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        userType,
        userTypes,
        userFields,
        values,
      } = formRenderProps;

      const { userType: selectedUserType } = values || {};
      const currentUserType = userType || selectedUserType;

      // email
      const emailRequired = validators.required(
        intl.formatMessage({
          id: 'SignupForm.emailRequired',
        })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({
          id: 'SignupForm.emailInvalid',
        })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooLong',
        },
        {
          maxLength: validators.PASSWORD_MAX_LENGTH,
        }
      );
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordMinLength,
        passwordMaxLength
      );

      // Custom user fields
      const userFieldProps = getPropsForCustomUserFieldInputs(userFields, intl, currentUserType);

      const noUserTypes = !currentUserType && !(userTypes?.length > 0);
      const userTypeConfig = userTypes?.find(config => config.userType === currentUserType);
      const showDefaultUserFields = currentUserType || noUserTypes;
      const showCustomUserFields = (currentUserType || noUserTypes) && userFieldProps?.length > 0;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress || !currentUserType;

      // Dynamic CTA text based on user type
      const getSubmitButtonText = () => {
        if (currentUserType === 'customer') {
          return intl.formatMessage({ id: 'SignupForm.startShopping' });
        } else if (currentUserType === 'provider') {
          return intl.formatMessage({ id: 'SignupForm.startSelling' });
        } else {
          return intl.formatMessage({ id: 'SignupForm.signUp' });
        }
      };

      // Help text based on user type
      const getHelpText = () => {
        if (currentUserType === 'customer') {
          return intl.formatMessage({ id: 'SignupForm.customerHelpText' });
        } else if (currentUserType === 'provider') {
          return intl.formatMessage({ id: 'SignupForm.providerHelpText' });
        }
        return null;
      };

      const helpText = getHelpText();

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {/* Hidden user type field */}
          <input type="hidden" name="userType" value={currentUserType || ''} />

          {showDefaultUserFields ? (
            <div className={css.formFields}>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={intl.formatMessage({
                  id: 'SignupForm.emailLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.emailPlaceholder',
                })}
                validate={validators.composeValidators(emailRequired, emailValid)}
                className={css.emailField}
              />

              <div className={css.nameFields}>
                <FieldTextInput
                  className={css.firstNameField}
                  type="text"
                  id={formId ? `${formId}.fname` : 'fname'}
                  name="fname"
                  autoComplete="given-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.firstNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.firstNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.firstNameRequired',
                    })
                  )}
                />
                <FieldTextInput
                  className={css.lastNameField}
                  type="text"
                  id={formId ? `${formId}.lname` : 'lname'}
                  name="lname"
                  autoComplete="family-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.lastNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.lastNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.lastNameRequired',
                    })
                  )}
                />
              </div>

              <FieldTextInput
                className={css.passwordField}
                type="password"
                id={formId ? `${formId}.password` : 'password'}
                name="password"
                autoComplete="new-password"
                label={intl.formatMessage({
                  id: 'SignupForm.passwordLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.passwordPlaceholder',
                })}
                validate={passwordValidators}
              />
            </div>
          ) : null}

          {showCustomUserFields ? (
            <div className={css.customFields}>
              {userFieldProps.map(({ key, ...fieldProps }) => (
                <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
              ))}
            </div>
          ) : null}

          {helpText && (
            <div className={css.helpText}>
              {helpText}
            </div>
          )}

          <div className={css.submitSection}>
            <PrimaryButton
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              className={css.submitButton}
            >
              {getSubmitButtonText()}
            </PrimaryButton>

            <div className={css.terms}>
              <FormattedMessage
                id="SignupForm.termsText"
                values={{
                  termsLink: (
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className={css.termsLink}>
                      <FormattedMessage id="SignupForm.termsLinkText" />
                    </a>
                  ),
                  privacyLink: (
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className={css.termsLink}>
                      <FormattedMessage id="SignupForm.privacyLinkText" />
                    </a>
                  )
                }}
              />
            </div>
          </div>
        </Form>
      );
    }}
  />
);

const SignupForm = props => {
  const intl = useIntl();
  return <SignupFormComponent {...props} intl={intl} />;
};

export default SignupForm;