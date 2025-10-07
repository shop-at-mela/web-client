import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';

import LoginForm from './LoginForm';

const { screen, userEvent, fireEvent, waitFor } = testingLibrary;

const noop = () => null;

const defaultProps = {
  intl: fakeIntl,
  onSubmit: noop,
  inProgress: false,
  authError: null
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('enables Log in button when required fields are filled', async () => {
      render(<LoginForm {...defaultProps} />);

      // Test that login button is disabled at first
      expect(screen.getByRole('button', { name: 'LoginForm.logIn' })).toBeDisabled();

      // Type the values to the login form
      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'joe@example.com'
      );
      await userEvent.type(screen.getByLabelText('LoginForm.passwordLabel'), 'secret-password');

      // Test that login button is enabled after typing the values
      expect(screen.getByRole('button', { name: 'LoginForm.logIn' })).toBeEnabled();
    });

    it('renders email and password fields correctly', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: 'LoginForm.emailLabel' })).toBeInTheDocument();
      expect(screen.getByLabelText('LoginForm.passwordLabel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'LoginForm.logIn' })).toBeInTheDocument();
    });

    it('has correct input types for fields', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has proper autocomplete attributes', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');

      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Form Validation', () => {
    it('validates required email field', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const submitButton = screen.getByRole('button', { name: 'LoginForm.logIn' });

      // Focus and blur email field without entering value
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      // Try to submit form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('LoginForm.emailRequired')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });

      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('LoginForm.emailInvalid')).toBeInTheDocument();
      });
    });

    it('validates required password field', async () => {
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');
      const submitButton = screen.getByRole('button', { name: 'LoginForm.logIn' });

      // Focus and blur password field without entering value
      fireEvent.focus(passwordInput);
      fireEvent.blur(passwordInput);

      // Try to submit form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('LoginForm.passwordRequired')).toBeInTheDocument();
      });
    });

    it('accepts valid email formats', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });

      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org'
      ];

      for (const email of validEmails) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, email);
        fireEvent.blur(emailInput);

        // Should not show validation error
        expect(screen.queryByText('LoginForm.emailInvalid')).not.toBeInTheDocument();
      }
    });

    it('rejects invalid email formats', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });

      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'spaces @example.com',
        'double@@domain.com'
      ];

      for (const email of invalidEmails) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, email);
        fireEvent.blur(emailInput);

        await waitFor(() => {
          expect(screen.getByText('LoginForm.emailInvalid')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct form data when valid', async () => {
      const mockOnSubmit = jest.fn();
      render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

      // Fill out the form
      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByLabelText('LoginForm.passwordLabel'),
        'password123'
      );

      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'LoginForm.logIn' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123'
          })
        );
      });
    });

    it('does not submit form when validation fails', async () => {
      const mockOnSubmit = jest.fn();
      render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

      // Only fill email, leave password empty
      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'test@example.com'
      );

      // Try to submit
      const submitButton = screen.getByRole('button', { name: 'LoginForm.logIn' });
      fireEvent.click(submitButton);

      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('handles form submission with Enter key', async () => {
      const mockOnSubmit = jest.fn();
      render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

      // Fill out the form
      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'test@example.com'
      );
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');
      await userEvent.type(passwordInput, 'password123');

      // Press Enter in password field
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123'
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('disables form and shows loading state when inProgress is true', () => {
      render(<LoginForm {...defaultProps} inProgress={true} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');
      const submitButton = screen.getByRole('button', { name: 'LoginForm.logIn' });

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loading text on submit button when inProgress', () => {
      render(<LoginForm {...defaultProps} inProgress={true} />);

      expect(screen.getByText('LoginForm.loggingIn')).toBeInTheDocument();
    });

    it('enables form when not in progress', () => {
      render(<LoginForm {...defaultProps} inProgress={false} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');

      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays authentication error when provided', () => {
      const authError = {
        type: 'error',
        name: 'AuthenticationError',
        message: 'Invalid credentials'
      };

      render(<LoginForm {...defaultProps} authError={authError} />);

      expect(screen.getByText('LoginForm.loginFailed')).toBeInTheDocument();
    });

    it('displays specific error for invalid credentials', () => {
      const authError = {
        type: 'error',
        name: 'AuthenticationError',
        status: 401
      };

      render(<LoginForm {...defaultProps} authError={authError} />);

      expect(screen.getByText('LoginForm.invalidCredentials')).toBeInTheDocument();
    });

    it('displays network error for connection issues', () => {
      const authError = {
        type: 'error',
        name: 'NetworkError',
        message: 'Network request failed'
      };

      render(<LoginForm {...defaultProps} authError={authError} />);

      expect(screen.getByText('LoginForm.networkError')).toBeInTheDocument();
    });

    it('displays generic error for unknown errors', () => {
      const authError = {
        type: 'error',
        name: 'UnknownError',
        status: 500
      };

      render(<LoginForm {...defaultProps} authError={authError} />);

      expect(screen.getByText('LoginForm.loginFailed')).toBeInTheDocument();
    });

    it('clears error when user starts typing', async () => {
      const authError = {
        type: 'error',
        name: 'AuthenticationError'
      };

      render(<LoginForm {...defaultProps} authError={authError} />);

      // Error should be visible initially
      expect(screen.getByText('LoginForm.loginFailed')).toBeInTheDocument();

      // Start typing in email field
      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      await userEvent.type(emailInput, 't');

      // Error should be cleared
      expect(screen.queryByText('LoginForm.loginFailed')).not.toBeInTheDocument();
    });
  });

  describe('Remember Me Functionality', () => {
    it('renders remember me checkbox when enabled', () => {
      render(<LoginForm {...defaultProps} showRememberMe={true} />);

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: 'LoginForm.rememberMe' });
      expect(rememberMeCheckbox).toBeInTheDocument();
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('handles remember me checkbox toggle', async () => {
      render(<LoginForm {...defaultProps} showRememberMe={true} />);

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: 'LoginForm.rememberMe' });

      await userEvent.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      await userEvent.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('includes remember me in form submission', async () => {
      const mockOnSubmit = jest.fn();
      render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} showRememberMe={true} />);

      // Fill form and check remember me
      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByLabelText('LoginForm.passwordLabel'),
        'password123'
      );
      await userEvent.click(screen.getByRole('checkbox', { name: 'LoginForm.rememberMe' }));

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'LoginForm.logIn' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123',
            rememberMe: true
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');

      expect(emailInput).toHaveAccessibleName('LoginForm.emailLabel');
      expect(passwordInput).toHaveAccessibleName('LoginForm.passwordLabel');
    });

    it('has proper ARIA attributes for error states', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });

      // Trigger validation error
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby');
      });
    });

    it('has proper focus management', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });
      const passwordInput = screen.getByLabelText('LoginForm.passwordLabel');

      // Tab through inputs
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(document.activeElement).toBe(passwordInput);
    });

    it('announces errors to screen readers', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });

      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorMessage = screen.getByText('LoginForm.emailInvalid');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Integration with External Services', () => {
    it('handles forgot password link clicks', () => {
      const mockOnForgotPassword = jest.fn();
      render(<LoginForm {...defaultProps} onForgotPassword={mockOnForgotPassword} />);

      const forgotPasswordLink = screen.getByText('LoginForm.forgotPassword');
      fireEvent.click(forgotPasswordLink);

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });

    it('handles signup link clicks', () => {
      const mockOnSignupClick = jest.fn();
      render(<LoginForm {...defaultProps} onSignupClick={mockOnSignupClick} />);

      const signupLink = screen.getByText('LoginForm.signupLink');
      fireEvent.click(signupLink);

      expect(mockOnSignupClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long email addresses', async () => {
      render(<LoginForm {...defaultProps} />);

      const longEmail = 'very.long.email.address.that.might.cause.issues@example-domain-name.com';
      const emailInput = screen.getByRole('textbox', { name: 'LoginForm.emailLabel' });

      await userEvent.type(emailInput, longEmail);
      expect(emailInput).toHaveValue(longEmail);
    });

    it('handles special characters in password', async () => {
      const mockOnSubmit = jest.fn();
      render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

      const specialPassword = 'P@$$w0rd!#$%^&*()';

      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByLabelText('LoginForm.passwordLabel'),
        specialPassword
      );

      fireEvent.click(screen.getByRole('button', { name: 'LoginForm.logIn' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            password: specialPassword
          })
        );
      });
    });

    it('handles rapid form submissions', async () => {
      const mockOnSubmit = jest.fn();
      render(<LoginForm {...defaultProps} onSubmit={mockOnSubmit} />);

      // Fill form
      await userEvent.type(
        screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByLabelText('LoginForm.passwordLabel'),
        'password123'
      );

      const submitButton = screen.getByRole('button', { name: 'LoginForm.logIn' });

      // Multiple rapid clicks
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      // All submissions should be registered (form doesn't prevent multiple clicks by default)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(3);
      });
    });
  });
});
