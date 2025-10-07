import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import UserFieldPhoneNumber from './UserFieldPhoneNumber';

// Mock the components
jest.mock('../../components', () => ({
  FieldPhoneNumberInput: ({ className, type, id, name, label, placeholder, validate, ...props }) => (
    <div data-testid="field-phone-number-input" className={className}>
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        data-validate={validate ? 'true' : 'false'}
        {...props}
      />
    </div>
  )
}));

// Mock validators
jest.mock('../../util/validators', () => ({
  required: (message) => jest.fn().mockReturnValue(message)
}));

const defaultProps = {
  formId: 'signup',
  formName: 'SignupForm',
  intl: fakeIntl
};

const createUserTypeConfig = ({
  displayInSignUp = true,
  required = false,
  defaultUserFields = {}
} = {}) => ({
  phoneNumberSettings: {
    displayInSignUp,
    required
  },
  defaultUserFields
});

describe('UserFieldPhoneNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Logic', () => {
    it('renders field when displayInSignUp is true and not disabled', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: false
      });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByTestId('field-phone-number-input')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not render when displayInSignUp is false', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: false,
        required: false
      });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('does not render when field is disabled in defaultUserFields', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: false,
        defaultUserFields: { phoneNumber: false }
      });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('does not render when userTypeConfig is undefined', () => {
      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={undefined}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('does not render when phoneNumberSettings is undefined', () => {
      const userTypeConfig = {
        defaultUserFields: {}
      };

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });
  });

  describe('Field Configuration', () => {
    it('renders with correct id when formId is provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'signup.phoneNumber');
    });

    it('renders with default id when formId is not provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutFormId = { ...defaultProps };
      delete propsWithoutFormId.formId;

      render(
        <UserFieldPhoneNumber
          {...propsWithoutFormId}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'phoneNumber');
    });

    it('renders with correct name attribute', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'phoneNumber');
    });

    it('renders with correct type attribute', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Internationalization', () => {
    it('renders with correct label from intl', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          formName="SignupForm"
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByText('SignupForm.phoneNumberLabel')).toBeInTheDocument();
    });

    it('renders with correct placeholder from intl', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          formName="SignupForm"
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'SignupForm.phoneNumberPlaceholder');
    });

    it('uses formName in intl message keys', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          formName="ProfileForm"
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByText('ProfileForm.phoneNumberLabel')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'ProfileForm.phoneNumberPlaceholder');
    });
  });

  describe('Validation Logic', () => {
    it('applies validation when field is required', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-validate', 'true');
    });

    it('does not apply validation when field is not required', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: false
      });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-validate', 'false');
    });

    it('does not apply validation when required is undefined', () => {
      const userTypeConfig = {
        phoneNumberSettings: {
          displayInSignUp: true
          // required is undefined
        }
      };

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-validate', 'false');
    });
  });

  describe('CSS Classes', () => {
    it('applies className when provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          className="custom-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-phone-number-input');
      expect(fieldContainer).toHaveClass('custom-class');
    });

    it('applies rootClassName when provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          rootClassName="root-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-phone-number-input');
      expect(fieldContainer).toHaveClass('root-class');
    });

    it('applies both className and rootClassName when provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          className="custom-class"
          rootClassName="root-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-phone-number-input');
      expect(fieldContainer).toHaveClass('custom-class');
      expect(fieldContainer).toHaveClass('root-class');
    });

    it('does not apply rootClassName when not provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          className="custom-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-phone-number-input');
      expect(fieldContainer).toHaveClass('custom-class');
      expect(fieldContainer).not.toHaveClass('undefined');
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('SignupForm.phoneNumberLabel');

      expect(input).toHaveAccessibleName('SignupForm.phoneNumberLabel');
      expect(label.getAttribute('for')).toBe('signup.phoneNumber');
    });

    it('maintains accessibility without formId', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutFormId = { ...defaultProps };
      delete propsWithoutFormId.formId;

      render(
        <UserFieldPhoneNumber
          {...propsWithoutFormId}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('SignupForm.phoneNumberLabel');

      expect(input).toHaveAccessibleName('SignupForm.phoneNumberLabel');
      expect(label.getAttribute('for')).toBe('phoneNumber');
    });
  });

  describe('Edge Cases', () => {
    it('handles null userTypeConfig gracefully', () => {
      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={null}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('handles empty userTypeConfig gracefully', () => {
      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={{}}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('handles missing phoneNumberSettings gracefully', () => {
      const userTypeConfig = {
        defaultUserFields: { phoneNumber: true }
        // phoneNumberSettings is missing
      };

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('handles empty phoneNumberSettings gracefully', () => {
      const userTypeConfig = {
        phoneNumberSettings: {},
        defaultUserFields: { phoneNumber: true }
      };

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });

    it('handles missing formName gracefully', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutFormName = { ...defaultProps };
      delete propsWithoutFormName.formName;

      render(
        <UserFieldPhoneNumber
          {...propsWithoutFormName}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByText('undefined.phoneNumberLabel')).toBeInTheDocument();
    });

    it('handles missing intl gracefully', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutIntl = { ...defaultProps };
      delete propsWithoutIntl.intl;

      expect(() => {
        render(
          <UserFieldPhoneNumber
            {...propsWithoutIntl}
            userTypeConfig={userTypeConfig}
          />
        );
      }).toThrow(); // This should throw because intl is required for formatMessage
    });
  });

  describe('Phone Number Specific Behavior', () => {
    it('uses FieldPhoneNumberInput component for phone number formatting', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByTestId('field-phone-number-input')).toBeInTheDocument();
    });

    it('maintains phone number field characteristics', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text'); // Phone numbers are text inputs for formatting
      expect(input).toHaveAttribute('name', 'phoneNumber');
    });
  });

  describe('Component State Behavior', () => {
    it('re-renders correctly when userTypeConfig changes', () => {
      const initialConfig = createUserTypeConfig({
        displayInSignUp: false,
        required: false
      });

      const { rerender } = render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={initialConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();

      const updatedConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      rerender(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={updatedConfig}
        />
      );

      expect(screen.getByTestId('field-phone-number-input')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-validate', 'true');
    });

    it('maintains field properties across re-renders', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      const { rerender } = render(
        <UserFieldPhoneNumber
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      let input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'signup.phoneNumber');
      expect(input).toHaveAttribute('name', 'phoneNumber');

      rerender(
        <UserFieldPhoneNumber
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'signup.phoneNumber');
      expect(input).toHaveAttribute('name', 'phoneNumber');
    });
  });

  describe('Integration Scenarios', () => {
    it('works correctly in signup context', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      render(
        <UserFieldPhoneNumber
          formId="signup"
          formName="SignupForm"
          userTypeConfig={userTypeConfig}
          intl={fakeIntl}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'signup.phoneNumber');
      expect(screen.getByText('SignupForm.phoneNumberLabel')).toBeInTheDocument();
    });

    it('works correctly in profile context', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: false
      });

      render(
        <UserFieldPhoneNumber
          formId="profile"
          formName="ProfileForm"
          userTypeConfig={userTypeConfig}
          intl={fakeIntl}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'profile.phoneNumber');
      expect(screen.getByText('ProfileForm.phoneNumberLabel')).toBeInTheDocument();
    });

    it('handles conditional rendering based on user type settings', () => {
      // Customer type allows phone number
      const customerConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      const { rerender } = render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={customerConfig}
        />
      );

      expect(screen.getByTestId('field-phone-number-input')).toBeInTheDocument();

      // Provider type doesn't allow phone number
      const providerConfig = createUserTypeConfig({
        displayInSignUp: false,
        required: false
      });

      rerender(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={providerConfig}
        />
      );

      expect(screen.queryByTestId('field-phone-number-input')).not.toBeInTheDocument();
    });
  });

  describe('Security Considerations', () => {
    it('does not expose sensitive phone number validation in DOM', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      const { container } = render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      // Check that validation functions are not exposed as strings
      expect(container.innerHTML).not.toContain('required');
      expect(container.innerHTML).not.toContain('validator');
    });

    it('properly handles field name consistency', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldPhoneNumber
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'phoneNumber'); // Consistent field name
    });
  });
});