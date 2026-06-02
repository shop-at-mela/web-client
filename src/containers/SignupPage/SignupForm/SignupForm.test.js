import React from 'react';
import '@testing-library/jest-dom';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

// Break the import chain: components/index.js → UserNav → routeConfiguration → pageDataLoadingAPI → ducks
jest.mock('../../../routing/routeConfiguration', () => []);

import SignupForm from './SignupForm';

const mockMessages = {
  'SignupForm.emailLabel': 'Email address',
  'SignupForm.emailPlaceholder': 'Enter your email',
  'SignupForm.emailRequired': 'Email is required',
  'SignupForm.emailInvalid': 'Please enter a valid email address',
  'SignupForm.firstNameLabel': 'First name',
  'SignupForm.firstNamePlaceholder': 'Enter your first name',
  'SignupForm.firstNameRequired': 'First name is required',
  'SignupForm.lastNameLabel': 'Last name',
  'SignupForm.lastNamePlaceholder': 'Enter your last name',
  'SignupForm.lastNameRequired': 'Last name is required',
  'SignupForm.brandNameLabel': 'Brand name',
  'SignupForm.brandNamePlaceholder': 'e.g. Masilo',
  'SignupForm.brandNameRequired': 'Brand name is required',
  'SignupForm.contactFirstNameLabel': 'Your first name',
  'SignupForm.contactFirstNamePlaceholder': 'Enter your first name',
  'SignupForm.contactLastNameLabel': 'Your last name',
  'SignupForm.contactLastNamePlaceholder': 'Enter your last name',
  'SignupForm.passwordLabel': 'Password',
  'SignupForm.passwordPlaceholder': 'Create a password',
  'SignupForm.passwordRequired': 'Password is required',
  'SignupForm.passwordTooShort': 'Password must be at least {minLength} characters',
  'SignupForm.passwordTooLong': 'Password must be less than {maxLength} characters',
  'SignupForm.startShopping': 'Start Saving Favorites',
  'SignupForm.startSelling': 'Start Selling',
  'SignupForm.signUp': 'Sign Up',
  'SignupForm.customerHelpText': 'Create an account to save your favorite Indian products and never lose track of what you love',
  'SignupForm.providerHelpText': 'Join as an Indian brand and start selling to customers who value authentic products',
  'SignupForm.termsText': 'By signing up, you agree to our {termsLink} and {privacyLink}',
  'SignupForm.termsLinkText': 'Terms of Service',
  'SignupForm.privacyLinkText': 'Privacy Policy',
};

const render = (ui) =>
  rtlRender(
    <MemoryRouter>
      <IntlProvider locale="en" messages={mockMessages}>
        {ui}
      </IntlProvider>
    </MemoryRouter>
  );

const mockProps = {
  onSubmit: jest.fn(),
  inProgress: false,
  userType: 'customer',
  userTypes: [
    { userType: 'customer', label: 'Customer' },
    { userType: 'provider', label: 'Provider' }
  ],
  userFields: [],
  preselectedUserType: null
};

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form rendering (customer)', () => {
    it('renders all required form fields for customer', () => {
      render(<SignupForm {...mockProps} />);

      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('does not show Brand name field for customers', () => {
      render(<SignupForm {...mockProps} userType="customer" />);

      expect(screen.queryByLabelText(/Brand name/i)).not.toBeInTheDocument();
    });

    it('includes hidden userType field', () => {
      const { container } = render(<SignupForm {...mockProps} userType="customer" />);

      const hiddenUserTypeField = container.querySelector('input[name="userType"]');
      expect(hiddenUserTypeField).toBeInTheDocument();
      expect(hiddenUserTypeField).toHaveAttribute('type', 'hidden');
      expect(hiddenUserTypeField).toHaveValue('customer');
    });

    it('renders terms and conditions link', () => {
      render(<SignupForm {...mockProps} />);

      expect(screen.getByText(/By signing up, you agree to our/i)).toBeInTheDocument();
      expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    });
  });

  describe('Customer-specific rendering', () => {
    const customerProps = { ...mockProps, userType: 'customer' };

    it('shows customer submit button text', () => {
      render(<SignupForm {...customerProps} />);

      expect(screen.getByText(/Start Saving Favorites/i)).toBeInTheDocument();
    });

    it('shows customer help text', () => {
      render(<SignupForm {...customerProps} />);

      expect(screen.getByText(/Create an account to save your favorite Indian products/i)).toBeInTheDocument();
    });

    it('uses "First name" label for customers', () => {
      render(<SignupForm {...customerProps} />);

      expect(screen.getByLabelText(/^First name$/i)).toBeInTheDocument();
    });

    it('uses "Last name" label for customers', () => {
      render(<SignupForm {...customerProps} />);

      expect(screen.getByLabelText(/^Last name$/i)).toBeInTheDocument();
    });
  });

  describe('Provider-specific rendering', () => {
    const providerProps = { ...mockProps, userType: 'provider' };

    it('shows provider submit button text', () => {
      render(<SignupForm {...providerProps} />);

      expect(screen.getByRole('button', { name: /Start Selling/i })).toBeInTheDocument();
    });

    it('shows provider help text', () => {
      render(<SignupForm {...providerProps} />);

      expect(screen.getByText(/Join as an Indian brand and start selling/i)).toBeInTheDocument();
    });

    it('shows Brand name field for providers', () => {
      render(<SignupForm {...providerProps} />);

      expect(screen.getByLabelText(/Brand name/i)).toBeInTheDocument();
    });

    it('uses "Your first name" label for providers', () => {
      render(<SignupForm {...providerProps} />);

      expect(screen.getByLabelText(/Your first name/i)).toBeInTheDocument();
    });

    it('uses "Your last name" label for providers', () => {
      render(<SignupForm {...providerProps} />);

      expect(screen.getByLabelText(/Your last name/i)).toBeInTheDocument();
    });

    it('Brand name field uses organization autocomplete', () => {
      render(<SignupForm {...providerProps} />);

      expect(screen.getByLabelText(/Brand name/i)).toHaveAttribute('autoComplete', 'organization');
    });
  });

  describe('Form validation', () => {
    it('shows required field validation messages for customer', async () => {
      const { container } = render(<SignupForm {...mockProps} />);

      // Submit directly on the form since button is disabled when form is invalid
      fireEvent.submit(container.querySelector('form'));

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });

    it('requires Brand name for provider signup', async () => {
      const { container } = render(<SignupForm {...mockProps} userType="provider" />);

      // Submit directly on the form since button is disabled when form is invalid
      fireEvent.submit(container.querySelector('form'));

      await waitFor(() => {
        expect(screen.getByText(/Brand name is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<SignupForm {...mockProps} />);

      const emailField = screen.getByLabelText(/Email address/i);
      await userEvent.type(emailField, 'invalid-email');
      fireEvent.blur(emailField);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('validates password length', async () => {
      render(<SignupForm {...mockProps} />);

      const passwordField = screen.getByLabelText(/Password/i);
      await userEvent.type(passwordField, '123');
      fireEvent.blur(passwordField);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least/i)).toBeInTheDocument();
      });
    });

    it('accepts valid customer form data', async () => {
      render(<SignupForm {...mockProps} />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/First name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /Start Saving Favorites/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/First name is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Last name is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Password is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('calls onSubmit with form data when valid (customer)', async () => {
      const onSubmitMock = jest.fn();
      render(<SignupForm {...mockProps} onSubmit={onSubmitMock} />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/First name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /Start Saving Favorites/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Final Form calls onSubmit(values, form, callback) — check first argument
        expect(onSubmitMock.mock.calls[0][0]).toEqual(
          expect.objectContaining({
            email: 'test@example.com',
            fname: 'John',
            lname: 'Doe',
            password: 'password123',
            userType: 'customer',
          })
        );
      });
    });

    it('includes displayName in submission for providers', async () => {
      const onSubmitMock = jest.fn();
      render(<SignupForm {...mockProps} onSubmit={onSubmitMock} userType="provider" />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'brand@example.com');
      await userEvent.type(screen.getByLabelText(/Brand name/i), 'Masilo');
      await userEvent.type(screen.getByLabelText(/Your first name/i), 'Priya');
      await userEvent.type(screen.getByLabelText(/Your last name/i), 'Sharma');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /Start Selling/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmitMock.mock.calls[0][0]).toEqual(
          expect.objectContaining({
            email: 'brand@example.com',
            displayName: 'Masilo',
            fname: 'Priya',
            lname: 'Sharma',
            userType: 'provider',
          })
        );
      });
    });

    it('includes userType in submission data', async () => {
      const onSubmitMock = jest.fn();
      render(<SignupForm {...mockProps} onSubmit={onSubmitMock} userType="provider" />);

      await userEvent.type(screen.getByLabelText(/Email address/i), 'provider@example.com');
      await userEvent.type(screen.getByLabelText(/Brand name/i), 'TestBrand');
      await userEvent.type(screen.getByLabelText(/Your first name/i), 'Jane');
      await userEvent.type(screen.getByLabelText(/Your last name/i), 'Smith');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /Start Selling/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmitMock.mock.calls[0][0]).toEqual(
          expect.objectContaining({
            userType: 'provider',
          })
        );
      });
    });
  });

  describe('Loading and disabled states', () => {
    it('disables submit button when form is invalid', () => {
      render(<SignupForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /Start Saving Favorites/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when in progress', () => {
      const { container } = render(<SignupForm {...mockProps} inProgress={true} />);

      // When inProgress=true, button shows a spinner (no text), so find by type
      const submitButton = container.querySelector('button[type="submit"]');
      expect(submitButton).toBeDisabled();
    });

    it('shows loading state on submit button when in progress', () => {
      const { container } = render(<SignupForm {...mockProps} inProgress={true} />);

      // When inProgress=true, button replaces text with a spinner (inProgress CSS class applied)
      const submitButton = container.querySelector('button[type="submit"]');
      expect(submitButton).toHaveClass('inProgress');
    });

    it('disables submit button when no userType is provided', () => {
      render(<SignupForm {...mockProps} userType={null} />);

      const submitButton = screen.getByRole('button', { name: /Sign Up/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Custom user fields', () => {
    const userFieldsProps = {
      ...mockProps,
      userFields: [
        {
          key: 'customField1',
          scope: 'public',
          schemaType: 'text',
          saveConfig: {
            label: 'Custom Field 1',
            displayInSignUp: true,
            isRequired: true,
          },
          userTypeConfig: {
            limitToUserTypeIds: false,
          },
        }
      ]
    };

    it('renders custom user fields when provided', () => {
      render(<SignupForm {...userFieldsProps} />);

      expect(screen.getByText(/Custom Field 1/i)).toBeInTheDocument();
    });

    it('shows custom fields section when fields are present', () => {
      const { container } = render(<SignupForm {...userFieldsProps} />);

      expect(container.querySelector('.customFields')).toBeInTheDocument();
    });

    it('hides custom fields section when no fields are present', () => {
      const { container } = render(<SignupForm {...mockProps} />);

      expect(container.querySelector('.customFields')).not.toBeInTheDocument();
    });
  });

  describe('Fallback behavior', () => {
    it('shows generic signup button when userType is unknown', () => {
      render(<SignupForm {...mockProps} userType="unknown" />);

      expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    });

    it('handles null userType gracefully', () => {
      render(<SignupForm {...mockProps} userType={null} />);

      expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    });

    it('does not show help text for unknown user types', () => {
      render(<SignupForm {...mockProps} userType="unknown" />);

      expect(screen.queryByText(/Create an account to save/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Join as an Indian brand/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels for customer', () => {
      render(<SignupForm {...mockProps} />);

      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('has proper form labels for provider', () => {
      render(<SignupForm {...mockProps} userType="provider" />);

      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Brand name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('has proper button role and accessible name', () => {
      render(<SignupForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /Start Saving Favorites/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('uses proper input types', () => {
      render(<SignupForm {...mockProps} />);

      expect(screen.getByLabelText(/Email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/Password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/First name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/Last name/i)).toHaveAttribute('type', 'text');
    });

    it('includes autocomplete attributes for customer', () => {
      render(<SignupForm {...mockProps} />);

      expect(screen.getByLabelText(/Email address/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/First name/i)).toHaveAttribute('autoComplete', 'given-name');
      expect(screen.getByLabelText(/Last name/i)).toHaveAttribute('autoComplete', 'family-name');
      expect(screen.getByLabelText(/Password/i)).toHaveAttribute('autoComplete', 'new-password');
    });
  });
});
