import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import UserFieldDisplayName from './UserFieldDisplayName';

// Mock the components
jest.mock('../../components', () => ({
  FieldTextInput: ({ className, type, id, name, label, placeholder, validate, ...props }) => (
    <div data-testid="field-text-input" className={className}>
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
  displayNameSettings: {
    displayInSignUp,
    required
  },
  defaultUserFields
});

describe('UserFieldDisplayName', () => {
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
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByTestId('field-text-input')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not render when displayInSignUp is false', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: false,
        required: false
      });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('does not render when field is disabled in defaultUserFields', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: false,
        defaultUserFields: { displayName: false }
      });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('does not render when userTypeConfig is undefined', () => {
      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={undefined}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('does not render when displayNameSettings is undefined', () => {
      const userTypeConfig = {
        defaultUserFields: {}
      };

      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });
  });

  describe('Field Configuration', () => {
    it('renders with correct id when formId is provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'signup.displayName');
    });

    it('renders with default id when formId is not provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutFormId = { ...defaultProps };
      delete propsWithoutFormId.formId;

      render(
        <UserFieldDisplayName
          {...propsWithoutFormId}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'displayName');
    });

    it('renders with correct name attribute', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'displayName');
    });

    it('renders with correct type attribute', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
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
        <UserFieldDisplayName
          {...defaultProps}
          formName="SignupForm"
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByText('SignupForm.displayNameLabel')).toBeInTheDocument();
    });

    it('renders with correct placeholder from intl', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          formName="SignupForm"
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'SignupForm.displayNamePlaceholder');
    });

    it('uses formName in intl message keys', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          formName="LoginForm"
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByText('LoginForm.displayNameLabel')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'LoginForm.displayNamePlaceholder');
    });
  });

  describe('Validation Logic', () => {
    it('applies validation when field is required', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      render(
        <UserFieldDisplayName
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
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-validate', 'false');
    });

    it('does not apply validation when required is undefined', () => {
      const userTypeConfig = {
        displayNameSettings: {
          displayInSignUp: true
          // required is undefined
        }
      };

      render(
        <UserFieldDisplayName
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
        <UserFieldDisplayName
          {...defaultProps}
          className="custom-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-text-input');
      expect(fieldContainer).toHaveClass('custom-class');
    });

    it('applies rootClassName when provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          rootClassName="root-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-text-input');
      expect(fieldContainer).toHaveClass('root-class');
    });

    it('applies both className and rootClassName when provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          className="custom-class"
          rootClassName="root-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-text-input');
      expect(fieldContainer).toHaveClass('custom-class');
      expect(fieldContainer).toHaveClass('root-class');
    });

    it('does not apply rootClassName when not provided', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          className="custom-class"
          userTypeConfig={userTypeConfig}
        />
      );

      const fieldContainer = screen.getByTestId('field-text-input');
      expect(fieldContainer).toHaveClass('custom-class');
      expect(fieldContainer).not.toHaveClass('undefined');
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });

      render(
        <UserFieldDisplayName
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('SignupForm.displayNameLabel');

      expect(input).toHaveAccessibleName('SignupForm.displayNameLabel');
      expect(label.getAttribute('for')).toBe('signup.displayName');
    });

    it('maintains accessibility without formId', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutFormId = { ...defaultProps };
      delete propsWithoutFormId.formId;

      render(
        <UserFieldDisplayName
          {...propsWithoutFormId}
          userTypeConfig={userTypeConfig}
        />
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('SignupForm.displayNameLabel');

      expect(input).toHaveAccessibleName('SignupForm.displayNameLabel');
      expect(label.getAttribute('for')).toBe('displayName');
    });
  });

  describe('Edge Cases', () => {
    it('handles null userTypeConfig gracefully', () => {
      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={null}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('handles empty userTypeConfig gracefully', () => {
      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={{}}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('handles missing displayNameSettings gracefully', () => {
      const userTypeConfig = {
        defaultUserFields: { displayName: true }
        // displayNameSettings is missing
      };

      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('handles empty displayNameSettings gracefully', () => {
      const userTypeConfig = {
        displayNameSettings: {},
        defaultUserFields: { displayName: true }
      };

      render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();
    });

    it('handles missing formName gracefully', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutFormName = { ...defaultProps };
      delete propsWithoutFormName.formName;

      render(
        <UserFieldDisplayName
          {...propsWithoutFormName}
          userTypeConfig={userTypeConfig}
        />
      );

      expect(screen.getByText('undefined.displayNameLabel')).toBeInTheDocument();
    });

    it('handles missing intl gracefully', () => {
      const userTypeConfig = createUserTypeConfig({ displayInSignUp: true });
      const propsWithoutIntl = { ...defaultProps };
      delete propsWithoutIntl.intl;

      expect(() => {
        render(
          <UserFieldDisplayName
            {...propsWithoutIntl}
            userTypeConfig={userTypeConfig}
          />
        );
      }).toThrow(); // This should throw because intl is required for formatMessage
    });
  });

  describe('Component State Behavior', () => {
    it('re-renders correctly when userTypeConfig changes', () => {
      const initialConfig = createUserTypeConfig({
        displayInSignUp: false,
        required: false
      });

      const { rerender } = render(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={initialConfig}
        />
      );

      expect(screen.queryByTestId('field-text-input')).not.toBeInTheDocument();

      const updatedConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      rerender(
        <UserFieldDisplayName
          {...defaultProps}
          userTypeConfig={updatedConfig}
        />
      );

      expect(screen.getByTestId('field-text-input')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-validate', 'true');
    });

    it('maintains field properties across re-renders', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      const { rerender } = render(
        <UserFieldDisplayName
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      let input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'signup.displayName');
      expect(input).toHaveAttribute('name', 'displayName');

      rerender(
        <UserFieldDisplayName
          {...defaultProps}
          formId="signup"
          userTypeConfig={userTypeConfig}
        />
      );

      input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'signup.displayName');
      expect(input).toHaveAttribute('name', 'displayName');
    });
  });

  describe('Integration Scenarios', () => {
    it('works correctly in signup context', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: true
      });

      render(
        <UserFieldDisplayName
          formId="signup"
          formName="SignupForm"
          userTypeConfig={userTypeConfig}
          intl={fakeIntl}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'signup.displayName');
      expect(screen.getByText('SignupForm.displayNameLabel')).toBeInTheDocument();
    });

    it('works correctly in profile context', () => {
      const userTypeConfig = createUserTypeConfig({
        displayInSignUp: true,
        required: false
      });

      render(
        <UserFieldDisplayName
          formId="profile"
          formName="ProfileForm"
          userTypeConfig={userTypeConfig}
          intl={fakeIntl}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'profile.displayName');
      expect(screen.getByText('ProfileForm.displayNameLabel')).toBeInTheDocument();
    });
  });
});