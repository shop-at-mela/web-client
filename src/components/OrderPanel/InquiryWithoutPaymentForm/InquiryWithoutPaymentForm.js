import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import { Form, PrimaryButton, SavedListingButton, AddToCartConfirmation } from '../..';

import css from './InquiryWithoutPaymentForm.module.css';

const renderForm = formRenderProps => {
  const [addedTrigger, setAddedTrigger] = useState(0);
  // FormRenderProps from final-form
  const {
    formId,
    className,
    rootClassName,
    handleSubmit,
    brand,
    productUrl,
    listingId,
    listingData,
    isOwnListing,
    finePrintComponent: FinePrint,
  } = formRenderProps;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Form id={formId} onSubmit={handleSubmit} className={classes}>
      <div className={css.submitButton}>
        {brand && productUrl ? (
          <>
            <SavedListingButton
              listingId={listingId}
              listingData={listingData}
              variant="cta"
              source="add_to_cart_button"
              onAdded={() => setAddedTrigger(t => t + 1)}
            />
            <AddToCartConfirmation trigger={addedTrigger} />
          </>
        ) : (
          <PrimaryButton type="submit">
            <FormattedMessage id="InquiryWithoutPaymentForm.ctaButton" />
          </PrimaryButton>
        )}
        {FinePrint && <FinePrint isOwnListing={isOwnListing} omitYouWontBeChargedMessage={true} />}
      </div>
    </Form>
  );
};

/**
 * A form for sending an inquiry without payment.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The ID of the form
 * @param {Function} props.onSubmit - The function to handle the form submission
 * @returns {JSX.Element}
 */
const InquiryWithoutPaymentForm = props => {
  const intl = useIntl();
  const initialValues = {};

  return <FinalForm initialValues={initialValues} {...props} intl={intl} render={renderForm} />;
};

export default InquiryWithoutPaymentForm;
